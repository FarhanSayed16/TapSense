from datetime import date, datetime, timedelta, timezone
from typing import Any
from zoneinfo import ZoneInfo

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.core.config import get_settings
from app.core.security import (
    create_access_token,
    get_current_user,
    verify_password,
)
from app.db.mongo import get_db
from app.schemas.auth import (
    CalibrationUpdate,
    DailyAggregateOut,
    DeviceOut,
    LocationCrumb,
    LoginRequest,
    OverviewOut,
    SessionOut,
    TapOut,
    TokenResponse,
    UserOut,
)
from app.services.baseline import build_baseline_report

router = APIRouter(tags=["auth"])
data_router = APIRouter(tags=["data"], dependencies=[Depends(get_current_user)])


def _campus_today() -> date:
    tz = ZoneInfo(get_settings().campus_timezone)
    return datetime.now(tz).date()


def _device_status(last_seen: datetime | None) -> str:
    if last_seen is None:
        return "unknown"
    if last_seen.tzinfo is None:
        last_seen = last_seen.replace(tzinfo=timezone.utc)
    age = (datetime.now(timezone.utc) - last_seen).total_seconds()
    stale_after = get_settings().device_stale_seconds
    return "online" if age <= stale_after else "stale"


def _tap_out(doc: dict[str, Any]) -> TapOut:
    return TapOut(
        id=doc["id"],
        name=doc["name"],
        org_id=doc["org_id"],
        campus_id=doc["campus_id"],
        building_id=doc["building_id"],
        floor_id=doc["floor_id"],
        zone_id=doc["zone_id"],
        is_control=bool(doc.get("is_control")),
        device_id=doc["device_id"],
        pulses_per_liter=float(doc.get("pulses_per_liter", 450)),
        role="control" if doc.get("is_control") else "intervention",
    )


@router.post("/auth/login", response_model=TokenResponse)
async def login(body: LoginRequest):
    db = get_db()
    try:
        user = await db.users.find_one({"email": body.email.lower()})
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database unavailable. Check MONGODB_URI / network.",
        ) from None
    if not user or not verify_password(body.password, user["password_hash"]):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    token = create_access_token(user["email"], extra={"role": user.get("role"), "org_id": user.get("org_id")})
    return TokenResponse(access_token=token)


@router.get("/auth/me", response_model=UserOut)
async def me(user: dict = Depends(get_current_user)):
    return UserOut(
        email=user["email"],
        name=user["name"],
        role=user["role"],
        org_id=user["org_id"],
    )


@router.post("/auth/logout")
async def logout(_: dict = Depends(get_current_user)):
    # Stateless JWT: client discards the token. Future: token denylist if needed.
    return {"ok": True, "detail": "Discard the access token on the client"}


@data_router.get("/taps", response_model=list[TapOut])
async def list_taps(role: str | None = Query(default=None, pattern="^(control|intervention)$")):
    query: dict[str, Any] = {}
    if role == "control":
        query["is_control"] = True
    elif role == "intervention":
        query["is_control"] = False
    cursor = get_db().taps.find(query, {"_id": 0}).sort("id", 1)
    return [_tap_out(doc) async for doc in cursor]


@data_router.get("/taps/{tap_id}", response_model=TapOut)
async def get_tap(tap_id: str):
    doc = await get_db().taps.find_one({"id": tap_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Tap not found")
    return _tap_out(doc)


@data_router.patch("/taps/{tap_id}/calibration", response_model=TapOut)
async def update_tap_calibration(
    tap_id: str,
    body: CalibrationUpdate,
    user: dict = Depends(get_current_user),
):
    """Phase 10 bucket-test: store pulses-per-liter for the tap (admin)."""
    db = get_db()
    doc = await db.taps.find_one({"id": tap_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Tap not found")

    now = datetime.now(timezone.utc)
    await db.taps.update_one(
        {"id": tap_id},
        {
            "$set": {
                "pulses_per_liter": float(body.pulses_per_liter),
                "updated_at": now,
            }
        },
    )
    await db.calibration.insert_one(
        {
            "tap_id": tap_id,
            "pulses_per_liter": float(body.pulses_per_liter),
            "note": body.note,
            "updated_by": user.get("email"),
            "created_at": now,
        }
    )
    updated = await db.taps.find_one({"id": tap_id}, {"_id": 0})
    return _tap_out(updated)


@data_router.post("/admin/reset-today")
async def reset_today(user: dict = Depends(get_current_user)):
    """Clear today's pilot data (sessions, readings, daily totals) for a clean day start."""
    db = get_db()
    settings = get_settings()
    tz = ZoneInfo(settings.campus_timezone)
    today_local = datetime.now(tz).date()
    day_start = datetime(today_local.year, today_local.month, today_local.day, tzinfo=tz).astimezone(
        timezone.utc
    )
    day_end = day_start + timedelta(days=1)
    day_str = today_local.isoformat()

    sessions = await db.sessions.delete_many(
        {
            "$or": [
                {"started_at": {"$gte": day_start, "$lt": day_end}},
                {"ended_at": {"$gte": day_start, "$lt": day_end}},
                {"ended_at": None},  # drop any open sessions too
            ]
        }
    )
    readings = await db.readings.delete_many({"ts": {"$gte": day_start, "$lt": day_end}})
    # also catch readings stamped with server created_at if ts was odd
    readings2 = await db.readings.delete_many(
        {"created_at": {"$gte": day_start, "$lt": day_end}}
    )
    daily = await db.daily_aggregates.delete_many({"date": day_str})

    return {
        "ok": True,
        "date": day_str,
        "timezone": settings.campus_timezone,
        "deleted": {
            "sessions": sessions.deleted_count,
            "readings": readings.deleted_count + readings2.deleted_count,
            "daily_aggregates": daily.deleted_count,
        },
        "reset_by": user.get("email"),
    }


@data_router.get("/sessions", response_model=list[SessionOut])
async def list_sessions(
    tap_id: str | None = None,
    limit: int = Query(default=50, ge=1, le=200),
):
    query: dict[str, Any] = {}
    if tap_id:
        query["tap_id"] = tap_id
    cursor = get_db().sessions.find(query, {"_id": 0}).sort("started_at", -1).limit(limit)
    out: list[SessionOut] = []
    async for doc in cursor:
        out.append(
            SessionOut(
                id=doc["id"],
                tap_id=doc["tap_id"],
                device_id=doc.get("device_id", ""),
                started_at=doc["started_at"],
                ended_at=doc.get("ended_at"),
                liters=float(doc.get("liters", 0)),
                duration_seconds=doc.get("duration_seconds"),
                is_long_tail=bool(doc.get("is_long_tail", False)),
            )
        )
    return out


@data_router.get("/aggregates/daily", response_model=list[DailyAggregateOut])
async def daily_aggregates(
    tap_id: str | None = None,
    days: int = Query(default=14, ge=1, le=90),
):
    # dates stored as YYYY-MM-DD campus-local strings
    today = _campus_today()
    start = (today - timedelta(days=days - 1)).isoformat()
    query: dict[str, Any] = {"date": {"$gte": start}}
    if tap_id:
        query["tap_id"] = tap_id
    cursor = get_db().daily_aggregates.find(query, {"_id": 0}).sort([("date", 1), ("tap_id", 1)])
    return [
        DailyAggregateOut(
            tap_id=doc["tap_id"],
            date=doc["date"],
            liters=float(doc.get("liters", 0)),
            session_count=int(doc.get("session_count", 0)),
        )
        async for doc in cursor
    ]


@data_router.get("/devices/{device_id}", response_model=DeviceOut)
async def get_device(device_id: str):
    doc = await get_db().devices.find_one({"id": device_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Device not found")
    last_seen = doc.get("last_seen_at")
    return DeviceOut(
        id=doc["id"],
        org_id=doc["org_id"],
        name=doc["name"],
        tap_ids=list(doc.get("tap_ids", [])),
        last_seen_at=last_seen,
        firmware_version=doc.get("firmware_version"),
        status=_device_status(last_seen),
    )


@data_router.get("/devices", response_model=list[DeviceOut])
async def list_devices():
    cursor = get_db().devices.find({}, {"_id": 0}).sort("id", 1)
    out: list[DeviceOut] = []
    async for doc in cursor:
        last_seen = doc.get("last_seen_at")
        out.append(
            DeviceOut(
                id=doc["id"],
                org_id=doc["org_id"],
                name=doc["name"],
                tap_ids=list(doc.get("tap_ids", [])),
                last_seen_at=last_seen,
                firmware_version=doc.get("firmware_version"),
                status=_device_status(last_seen),
            )
        )
    return out


@data_router.get("/overview", response_model=OverviewOut)
async def overview():
    db = get_db()
    org = await db.organizations.find_one({"id": "org_pilot"}, {"_id": 0})
    campus = await db.campuses.find_one({"id": "campus_main"}, {"_id": 0})
    building = await db.buildings.find_one({"id": "building_hostel"}, {"_id": 0})
    floor = await db.floors.find_one({"id": "floor_1"}, {"_id": 0})
    zone = await db.zones.find_one({"id": "zone_washroom"}, {"_id": 0})
    if not all([org, campus, building, floor, zone]):
        raise HTTPException(status_code=404, detail="Pilot location not seeded")

    taps = [_tap_out(doc) async for doc in db.taps.find({}, {"_id": 0}).sort("id", 1)]
    today = _campus_today().isoformat()
    week_start = (_campus_today() - timedelta(days=6)).isoformat()

    today_docs = await db.daily_aggregates.find({"date": today}, {"_id": 0}).to_list(50)
    week_docs = await db.daily_aggregates.find({"date": {"$gte": week_start}}, {"_id": 0}).to_list(200)
    tap_liters_today: dict[str, float] = {}
    for d in today_docs:
        tid = d.get("tap_id")
        if tid:
            tap_liters_today[tid] = tap_liters_today.get(tid, 0.0) + float(d.get("liters", 0))

    # Include in-progress sessions so Overview updates while water is flowing
    open_liters = 0.0
    async for session in db.sessions.find({"ended_at": None}, {"_id": 0, "tap_id": 1, "liters": 1}):
        lit = float(session.get("liters", 0))
        open_liters += lit
        tid = session.get("tap_id")
        if tid:
            tap_liters_today[tid] = tap_liters_today.get(tid, 0.0) + lit

    liters_today = sum(tap_liters_today.values())
    liters_week = sum(float(d.get("liters", 0)) for d in week_docs) + open_liters

    active = await db.sessions.count_documents({"ended_at": None})
    device = await db.devices.find_one({"id": "device_01"}, {"_id": 0})
    device_online = _device_status(device.get("last_seen_at") if device else None) == "online"

    payload = OverviewOut(
        location=LocationCrumb(
            org_id=org["id"],
            org_name=org["name"],
            campus_id=campus["id"],
            campus_name=campus["name"],
            building_id=building["id"],
            building_name=building["name"],
            floor_id=floor["id"],
            floor_name=floor["name"],
            zone_id=zone["id"],
            zone_name=zone["name"],
        ),
        liters_today=liters_today,
        liters_week=liters_week,
        active_sessions=active,
        device_online=device_online,
        taps=taps,
        tap_liters_today=tap_liters_today,
    )
    # Explicit dump so tap_liters_today always appears in JSON
    return payload.model_dump()


@data_router.get("/reports/baseline")
async def baseline_report(
    start: str = Query(..., description="YYYY-MM-DD"),
    end: str = Query(..., description="YYYY-MM-DD"),
):
    """Phase 11 baseline metrics for a campus-date window."""
    try:
        return await build_baseline_report(start, end)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
