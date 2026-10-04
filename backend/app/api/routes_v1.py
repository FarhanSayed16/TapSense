from datetime import date, datetime, timedelta, timezone
from typing import Any, Literal
from zoneinfo import ZoneInfo

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import PlainTextResponse

from app.core.config import get_settings
from app.core.roles import (
    CAP_ADMIN,
    CAP_ALERTS_MANAGE,
    CAP_CALIBRATE,
    CAP_FLAGS,
    CAP_MEMBERS,
    CAP_RESET,
    CAP_SCIENCE,
    CAP_WRITE_REGISTRY,
    allowed_building_ids,
    assert_building_access,
    normalize_role,
    require_caps,
    user_capabilities,
)
from app.core.security import (
    create_access_token,
    get_current_user,
    verify_password,
)
from app.db.mongo import get_db
from app.db.mongo import ping_db
from app.db.redis_client import ping_redis
from app.schemas.auth import (
    AlertResolveBody,
    CalibrationUpdate,
    DailyAggregateOut,
    DeviceOut,
    DeviceRegister,
    FeatureFlagsUpdate,
    LocationCreate,
    LocationCrumb,
    LoginRequest,
    MemberInvite,
    MemberUpdate,
    OpenSessionOut,
    OrgOut,
    OverviewOut,
    PhaseWindowUpdate,
    ProductPhaseOut,
    ProductPhaseUpdate,
    SessionOut,
    SystemHealthOut,
    TapOut,
    LeaderboardBoardUpdate,
    SocialFieldUpdate,
    TapRegister,
    ThresholdSuggestRequest,
    ThresholdsUpdate,
    TokenResponse,
    UserOut,
)
from app.services.alerts import ack_alert, list_alerts, resolve_alert, sweep_alerts
from app.services.analytics import (
    compare_phases,
    control_vs_intervention,
    export_daily_rows,
    export_sessions_rows,
    get_phase_windows,
    reconcile_daily_from_sessions,
    rows_to_csv,
    set_phase_window,
    window_metrics,
)
from app.services.deployment import (
    PILOT_BUILDING_ID,
    ensure_pilot_and_showcase_tagged,
    filter_docs_by_scope,
    showcase_enabled,
)
from app.services.org import (
    get_org,
    invite_member,
    list_members,
    update_feature_flags,
    update_member,
)
from app.services.baseline import build_baseline_report
from app.services.product_phase import get_product_phase, set_product_phase
from app.services.leaderboard import (
    build_snapshot,
    compute_weekly_aggregates,
    get_or_build_snapshot,
    list_boards,
    public_board_view,
    refresh_all_boards,
    update_board,
    week_bounds,
)
from app.services.locations import (
    create_location_node,
    get_building_dashboard,
    get_floor_dashboard,
    get_location_tree,
    get_zone_dashboard,
    list_buildings,
    register_device,
    register_tap,
)
from app.services.social_field import (
    attribution_note,
    get_social_field,
    lock_cadence,
    public_social_board,
    unlock_cadence,
    update_social_field,
)
from app.services.thresholds import (
    apply_suggestions,
    get_thresholds,
    live_color_state,
    suggest_thresholds_from_window,
    update_thresholds,
)

router = APIRouter(tags=["auth"])
data_router = APIRouter(tags=["data"], dependencies=[Depends(get_current_user)])


def _campus_today() -> date:
    tz = ZoneInfo(get_settings().campus_timezone)
    return datetime.now(tz).date()


def _parse_day(value: str) -> date:
    return date.fromisoformat(value)


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
        role=normalize_role(user.get("role")),
        org_id=user["org_id"],
        capabilities=user_capabilities(user),
        building_ids=allowed_building_ids(user),
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
    docs = [doc async for doc in get_db().taps.find(query, {"_id": 0}).sort("id", 1)]
    docs = await filter_docs_by_scope(docs, kind="tap")
    return [_tap_out(doc) for doc in docs]


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
    user: dict = Depends(require_caps(CAP_CALIBRATE)),
):
    """Phase 10 bucket-test: store pulses-per-liter for the tap."""
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


@data_router.get("/product-phase", response_model=ProductPhaseOut)
async def read_product_phase():
    """Current science phase (0=silent, 1=visibility on B/C)."""
    return await get_product_phase()


@data_router.patch("/product-phase", response_model=ProductPhaseOut)
async def update_product_phase(
    body: ProductPhaseUpdate,
    user: dict = Depends(require_caps(CAP_ADMIN)),
):
    """Admin toggle for product phase. Does not change logging of Tap A."""
    try:
        return await set_product_phase(int(body.product_phase), updated_by=user.get("email"))
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get("/visibility/live")
async def visibility_live():
    """Public kiosk feed — intervention taps only (never control). Includes color bands in Phase 2+."""
    state = await live_color_state()
    return {
        "product_phase": state["product_phase"],
        "visibility_enabled": state["visibility_enabled"],
        "color_enabled": state["color_enabled"],
        "label": state["label"],
        "rule": state["rule"],
        "bands": state["bands"],
        "channels": state["channels"],
    }


@router.get("/public/leaderboard/{board_id}")
async def public_leaderboard(
    board_id: str,
    week_start: str | None = Query(default=None, description="YYYY-MM-DD inside the week"),
):
    """Public read API — limited fields for wall/TV boards (Phase 3 recognition when social on)."""
    try:
        if week_start:
            return await public_board_view(board_id, week_start)
        return await public_social_board(board_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@data_router.post("/admin/reset-today")
async def reset_today(user: dict = Depends(require_caps(CAP_RESET))):
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


def _device_out(doc: dict[str, Any]) -> DeviceOut:
    last_seen = doc.get("last_seen_at")
    tap_ids = list(doc.get("tap_ids", []))
    architecture = doc.get("architecture") or (
        "multi_tap" if len(tap_ids) > 1 else "single_tap"
    )
    return DeviceOut(
        id=doc["id"],
        org_id=doc["org_id"],
        name=doc["name"],
        tap_ids=tap_ids,
        last_seen_at=last_seen,
        firmware_version=doc.get("firmware_version"),
        status=_device_status(last_seen),  # type: ignore[arg-type]
        wifi_rssi=doc.get("wifi_rssi"),
        architecture=architecture,
        building_id=doc.get("building_id"),
        floor_id=doc.get("floor_id"),
        zone_id=doc.get("zone_id"),
        mqtt_topic=doc.get("mqtt_topic"),
    )


def _device_in_scope(doc: dict[str, Any], allowed: list[str] | None) -> bool:
    if allowed is None:
        return True
    if doc.get("building_id") in allowed:
        return True
    return False


@data_router.get("/devices/{device_id}", response_model=DeviceOut)
async def get_device(device_id: str, user: dict = Depends(get_current_user)):
    doc = await get_db().devices.find_one({"id": device_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Device not found")
    if not _device_in_scope(doc, allowed_building_ids(user)):
        raise HTTPException(status_code=403, detail="Building out of scope")
    return _device_out(doc)


@data_router.get("/devices", response_model=list[DeviceOut])
async def list_devices(user: dict = Depends(get_current_user)):
    allowed = allowed_building_ids(user)
    docs = [doc async for doc in get_db().devices.find({}, {"_id": 0}).sort("id", 1)]
    docs = await filter_docs_by_scope(docs, kind="device")
    out = []
    for doc in docs:
        if _device_in_scope(doc, allowed):
            out.append(_device_out(doc))
    return out


@data_router.post("/devices", response_model=DeviceOut)
async def create_or_update_device(
    body: DeviceRegister,
    user: dict = Depends(require_caps(CAP_WRITE_REGISTRY)),
):
    try:
        doc = await register_device(body.model_dump(exclude_none=True))
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    assert doc is not None
    return _device_out(doc)


@data_router.get("/overview", response_model=OverviewOut)
async def overview(
    building_id: str | None = Query(default=None, description="Scope overview to a building"),
    user: dict = Depends(get_current_user),
):
    db = get_db()
    org = await db.organizations.find_one({"id": "org_pilot"}, {"_id": 0})
    campus = await db.campuses.find_one({"id": "campus_main"}, {"_id": 0})
    bid = building_id or "building_hostel"
    assert_building_access(user, bid)
    building = await db.buildings.find_one({"id": bid}, {"_id": 0})
    if not building:
        raise HTTPException(status_code=404, detail="Building not found")
    floor = await db.floors.find_one({"building_id": bid}, {"_id": 0})
    zone = None
    if floor:
        zone = await db.zones.find_one({"floor_id": floor["id"]}, {"_id": 0})
    if not all([org, campus, building]):
        raise HTTPException(status_code=404, detail="Pilot location not seeded")
    if not floor or not zone:
        # Building exists but empty — still return empty overview shell
        floor = floor or {
            "id": f"{bid}_floor_none",
            "name": "—",
        }
        zone = zone or {
            "id": f"{bid}_zone_none",
            "name": "—",
        }

    tap_query: dict[str, Any] = {"building_id": bid}
    taps = [_tap_out(doc) async for doc in db.taps.find(tap_query, {"_id": 0}).sort("id", 1)]
    today = _campus_today().isoformat()
    week_start = (_campus_today() - timedelta(days=6)).isoformat()

    today_docs = await db.daily_aggregates.find({"date": today}, {"_id": 0}).to_list(50)
    week_docs = await db.daily_aggregates.find({"date": {"$gte": week_start}}, {"_id": 0}).to_list(200)
    tap_liters_today: dict[str, float] = {}
    for d in today_docs:
        tid = d.get("tap_id")
        if tid:
            tap_liters_today[tid] = tap_liters_today.get(tid, 0.0) + float(d.get("liters", 0))

    open_liters = 0.0
    open_sessions: list[OpenSessionOut] = []
    tap_last_activity: dict[str, datetime | None] = {t.id: None for t in taps}

    async for session in db.sessions.find({"ended_at": None}, {"_id": 0}):
        lit = float(session.get("liters", 0))
        open_liters += lit
        tid = session.get("tap_id")
        if tid:
            tap_liters_today[tid] = tap_liters_today.get(tid, 0.0) + lit
            last_flow = session.get("last_flow_at") or session.get("started_at")
            open_sessions.append(
                OpenSessionOut(
                    id=session["id"],
                    tap_id=tid,
                    liters=lit,
                    started_at=session["started_at"],
                    last_flow_at=last_flow,
                )
            )
            if last_flow is not None:
                prev = tap_last_activity.get(tid)
                if prev is None or last_flow > prev:
                    tap_last_activity[tid] = last_flow

    # Last activity from most recent closed session per tap
    for tap in taps:
        recent = await db.sessions.find_one(
            {"tap_id": tap.id, "ended_at": {"$ne": None}},
            {"_id": 0, "ended_at": 1, "last_flow_at": 1},
            sort=[("ended_at", -1)],
        )
        if recent:
            stamp = recent.get("ended_at") or recent.get("last_flow_at")
            prev = tap_last_activity.get(tap.id)
            if stamp is not None and (prev is None or stamp > prev):
                tap_last_activity[tap.id] = stamp

    liters_today = sum(tap_liters_today.values())
    liters_week = sum(float(d.get("liters", 0)) for d in week_docs) + open_liters

    # Any device covering taps in this building (Wave-2 multi-device)
    tap_ids = [t.id for t in taps]
    devices = [
        doc
        async for doc in db.devices.find(
            {"$or": [{"building_id": bid}, {"tap_ids": {"$in": tap_ids}}]},
            {"_id": 0},
        )
    ]
    if not devices:
        devices = [doc async for doc in db.devices.find({}, {"_id": 0}).limit(1)]
    online_devices = [d for d in devices if _device_status(d.get("last_seen_at")) == "online"]
    device = online_devices[0] if online_devices else (devices[0] if devices else None)
    last_seen = device.get("last_seen_at") if device else None
    device_online = bool(online_devices)

    mongo_ok = await ping_db()
    settings = get_settings()
    redis_configured = bool(
        settings.redis_enabled
        and settings.upstash_redis_rest_url
        and settings.upstash_redis_rest_token
    )
    redis_ok = await ping_redis() if redis_configured else None
    phase = await get_product_phase()

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
        active_sessions=len(open_sessions),
        device_online=device_online,
        taps=taps,
        tap_liters_today=tap_liters_today,
        tap_last_activity=tap_last_activity,
        open_sessions=open_sessions,
        health=SystemHealthOut(
            mongo=mongo_ok,
            redis=redis_ok,
            device_online=device_online,
            device_last_seen_at=last_seen,
        ),
        device_last_seen_at=last_seen,
        product_phase=phase.product_phase,
        phase_label=phase.label,
        visibility_enabled=phase.visibility_enabled,
        color_enabled=phase.color_enabled,
        social_enabled=phase.social_enabled,
    )
    return payload.model_dump(mode="json")


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


# --- Phase 14 analytics & exports ---


# --- Phase 19 locations & scale registry ---


@data_router.get("/locations/tree")
async def locations_tree(user: dict = Depends(get_current_user)):
    try:
        tree = await get_location_tree()
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    allowed = allowed_building_ids(user)
    if allowed is None:
        return tree
    campuses = tree.get("campuses") or []
    for campus in campuses:
        campus["buildings"] = [
            b for b in (campus.get("buildings") or []) if b.get("id") in allowed
        ]
    return tree


@data_router.get("/locations/buildings")
async def locations_buildings(user: dict = Depends(get_current_user)):
    buildings = await list_buildings()
    allowed = allowed_building_ids(user)
    if allowed is not None:
        buildings = [b for b in buildings if b.get("id") in allowed]
    return {"buildings": buildings}


@data_router.get("/locations/buildings/{building_id}")
async def locations_building(building_id: str, user: dict = Depends(get_current_user)):
    assert_building_access(user, building_id)
    try:
        return await get_building_dashboard(building_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@data_router.get("/locations/floors/{floor_id}")
async def locations_floor(floor_id: str, user: dict = Depends(get_current_user)):
    floor = await get_db().floors.find_one({"id": floor_id}, {"_id": 0, "building_id": 1})
    if floor:
        assert_building_access(user, floor.get("building_id"))
    try:
        return await get_floor_dashboard(floor_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@data_router.get("/locations/zones/{zone_id}")
async def locations_zone(zone_id: str, user: dict = Depends(get_current_user)):
    zone = await get_db().zones.find_one({"id": zone_id}, {"_id": 0, "building_id": 1})
    if zone:
        assert_building_access(user, zone.get("building_id"))
    try:
        return await get_zone_dashboard(zone_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@data_router.post("/locations/{kind}")
async def locations_create(
    kind: Literal["building", "floor", "zone"],
    body: LocationCreate,
    user: dict = Depends(require_caps(CAP_WRITE_REGISTRY)),
):
    try:
        return await create_location_node(kind, body.model_dump(exclude_none=True))
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@data_router.post("/taps")
async def create_tap(
    body: TapRegister,
    user: dict = Depends(require_caps(CAP_WRITE_REGISTRY)),
):
    try:
        return await register_tap(body.model_dump(exclude_none=True))
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


# --- Phase 18 social field ---


@data_router.get("/social-field")
async def read_social_field():
    return await get_social_field()


@data_router.patch("/social-field")
async def patch_social_field(
    body: SocialFieldUpdate,
    user: dict = Depends(require_caps(CAP_SCIENCE)),
):
    try:
        return await update_social_field(
            body.model_dump(exclude_none=True),
            updated_by=user.get("email"),
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@data_router.post("/social-field/lock-cadence")
async def social_lock_cadence(user: dict = Depends(require_caps(CAP_SCIENCE))):
    return await lock_cadence(updated_by=user.get("email"))


@data_router.post("/social-field/unlock-cadence")
async def social_unlock_cadence(user: dict = Depends(require_caps(CAP_SCIENCE))):
    return await unlock_cadence(updated_by=user.get("email"))


@data_router.get("/social-field/attribution")
async def social_attribution():
    """Three-layer attribution helper (visibility → color → social)."""
    return await attribution_note()


# --- Phase 17 leaderboard ---


@data_router.get("/leaderboard/boards")
async def leaderboard_boards():
    return {"boards": await list_boards()}


@data_router.patch("/leaderboard/boards/{board_id}")
async def patch_leaderboard_board(
    board_id: str,
    body: LeaderboardBoardUpdate,
    user: dict = Depends(require_caps(CAP_SCIENCE)),
):
    try:
        return await update_board(
            board_id,
            body.model_dump(exclude_none=True),
            updated_by=user.get("email"),
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@data_router.get("/leaderboard/weekly")
async def leaderboard_weekly(
    week_start: str | None = Query(default=None, description="YYYY-MM-DD; default=current week Mon"),
):
    start, end = week_bounds(_parse_day(week_start) if week_start else None)
    try:
        return await compute_weekly_aggregates(start.isoformat(), end.isoformat())
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@data_router.get("/leaderboard/boards/{board_id}/snapshot")
async def leaderboard_snapshot(
    board_id: str,
    week_start: str | None = Query(default=None),
    refresh: bool = Query(default=False),
):
    try:
        if refresh:
            return await build_snapshot(board_id, week_start)
        return await get_or_build_snapshot(board_id, week_start)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@data_router.post("/leaderboard/refresh")
async def leaderboard_refresh(
    week_start: str | None = Query(default=None),
    user: dict = Depends(require_caps(CAP_SCIENCE)),
):
    snaps = await refresh_all_boards(week_start)
    return {
        "count": len(snaps),
        "refreshed_by": user.get("email"),
        "snapshots": snaps,
    }


# --- Phase 16 thresholds (loss-aversion color) ---


@data_router.get("/thresholds")
async def read_thresholds():
    return await get_thresholds()


@data_router.patch("/thresholds")
async def patch_thresholds(
    body: ThresholdsUpdate,
    user: dict = Depends(require_caps(CAP_SCIENCE)),
):
    try:
        bands = body.bands.model_dump(exclude_none=True) if body.bands else None
        taps = None
        if body.taps:
            taps = {k: v.model_dump(exclude_none=True) for k, v in body.taps.items()}
        return await update_thresholds(bands=bands, taps=taps, updated_by=user.get("email"))
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@data_router.post("/thresholds/suggest")
async def suggest_thresholds(
    body: ThresholdSuggestRequest,
    user: dict = Depends(require_caps(CAP_SCIENCE)),
):
    try:
        if body.apply:
            return await apply_suggestions(body.start, body.end, updated_by=user.get("email"))
        return await suggest_thresholds_from_window(body.start, body.end)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@data_router.get("/thresholds/live")
async def thresholds_live():
    """Admin live color state for intervention taps."""
    return await live_color_state()


@data_router.get("/phase-windows")
async def read_phase_windows():
    return await get_phase_windows()


@data_router.patch("/phase-windows")
async def update_phase_window(
    body: PhaseWindowUpdate,
    user: dict = Depends(require_caps(CAP_SCIENCE)),
):
    try:
        return await set_phase_window(
            int(body.phase),
            body.start,
            body.end,
            notes=body.notes,
            updated_by=user.get("email"),
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@data_router.get("/analytics/window")
async def analytics_window(
    start: str = Query(..., description="YYYY-MM-DD"),
    end: str = Query(..., description="YYYY-MM-DD"),
):
    try:
        return await window_metrics(start, end)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@data_router.get("/analytics/compare")
async def analytics_compare(
    phase_a: int = Query(default=0, ge=0, le=3),
    phase_b: int = Query(default=1, ge=0, le=3),
    start_a: str | None = None,
    end_a: str | None = None,
    start_b: str | None = None,
    end_b: str | None = None,
):
    """Compare two phase windows (or explicit date overrides)."""
    try:
        return await compare_phases(
            phase_a=phase_a,
            phase_b=phase_b,
            start_a=start_a,
            end_a=end_a,
            start_b=start_b,
            end_b=end_b,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@data_router.get("/analytics/control-vs-intervention")
async def analytics_control_split(
    start: str = Query(..., description="YYYY-MM-DD"),
    end: str = Query(..., description="YYYY-MM-DD"),
):
    try:
        return await control_vs_intervention(start, end)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@data_router.get("/exports/sessions")
async def export_sessions(
    start: str = Query(..., description="YYYY-MM-DD"),
    end: str = Query(..., description="YYYY-MM-DD"),
    format: Literal["json", "csv"] = Query(default="json"),
):
    try:
        rows = await export_sessions_rows(start, end)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    if format == "csv":
        return PlainTextResponse(
            rows_to_csv(rows),
            media_type="text/csv",
            headers={"Content-Disposition": f'attachment; filename="sessions_{start}_{end}.csv"'},
        )
    return {"start": start, "end": end, "count": len(rows), "rows": rows}


@data_router.get("/exports/daily")
async def export_daily(
    start: str = Query(..., description="YYYY-MM-DD"),
    end: str = Query(..., description="YYYY-MM-DD"),
    format: Literal["json", "csv"] = Query(default="json"),
):
    try:
        rows = await export_daily_rows(start, end)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    if format == "csv":
        return PlainTextResponse(
            rows_to_csv(rows),
            media_type="text/csv",
            headers={"Content-Disposition": f'attachment; filename="daily_{start}_{end}.csv"'},
        )
    return {"start": start, "end": end, "count": len(rows), "rows": rows}


@data_router.get("/alerts")
async def get_alerts(
    refresh: bool = Query(default=True),
    open_only: bool = Query(default=True),
    user: dict = Depends(get_current_user),
):
    """Device offline + leak-suspect alerts. refresh=true runs a sweep first."""
    if refresh:
        await sweep_alerts()
    alerts = await list_alerts(
        open_only=open_only,
        building_ids=allowed_building_ids(user),
    )
    return {"count": len(alerts), "alerts": alerts}


@data_router.post("/alerts/{alert_id}/ack")
async def post_ack_alert(
    alert_id: str,
    user: dict = Depends(require_caps(CAP_ALERTS_MANAGE)),
):
    try:
        return await ack_alert(alert_id, by=user.get("email"))
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@data_router.post("/alerts/{alert_id}/resolve")
async def post_resolve_alert(
    alert_id: str,
    body: AlertResolveBody | None = None,
    user: dict = Depends(require_caps(CAP_ALERTS_MANAGE)),
):
    try:
        return await resolve_alert(
            alert_id,
            by=user.get("email"),
            note=(body.note if body else None),
        )
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@data_router.post("/admin/reconcile-daily")
async def admin_reconcile_daily(
    day: str | None = Query(default=None, description="YYYY-MM-DD; default=yesterday campus"),
    user: dict = Depends(require_caps(CAP_ADMIN)),
):
    """Rebuild daily_aggregates for one campus day from closed sessions."""
    try:
        result = await reconcile_daily_from_sessions(day)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    result["reconciled_by"] = user.get("email")
    return result


# --- Phase 20 org / members / feature flags ---


@data_router.get("/org", response_model=OrgOut)
async def read_org(user: dict = Depends(get_current_user)):
    try:
        org = await get_org(user.get("org_id", "org_pilot"))
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return OrgOut(**{k: org[k] for k in ("id", "name", "timezone", "feature_flags")})


@data_router.patch("/org/feature-flags", response_model=OrgOut)
async def patch_feature_flags(
    body: FeatureFlagsUpdate,
    user: dict = Depends(require_caps(CAP_FLAGS)),
):
    try:
        org = await update_feature_flags(
            user.get("org_id", "org_pilot"),
            body.flags,
            updated_by=user.get("email"),
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return OrgOut(**{k: org[k] for k in ("id", "name", "timezone", "feature_flags")})


@data_router.get("/org/members")
async def get_members(user: dict = Depends(require_caps(CAP_MEMBERS))):
    return {"members": await list_members(user.get("org_id", "org_pilot"))}


@data_router.post("/org/members")
async def post_member(
    body: MemberInvite,
    user: dict = Depends(require_caps(CAP_MEMBERS)),
):
    try:
        return await invite_member(
            email=body.email,
            name=body.name,
            role=body.role,
            password=body.password,
            org_id=user.get("org_id", "org_pilot"),
            building_ids=body.building_ids,
            invited_by=user.get("email"),
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@data_router.patch("/org/members/{email}")
async def patch_member(
    email: str,
    body: MemberUpdate,
    user: dict = Depends(require_caps(CAP_MEMBERS)),
):
    try:
        return await update_member(
            email,
            body.model_dump(exclude_none=True),
            updated_by=user.get("email"),
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@data_router.get("/deployment")
async def deployment_status(user: dict = Depends(get_current_user)):
    """Pilot vs showcase mode — physical pilot remains 1 ESP × 3 taps."""
    org_id = user.get("org_id", "org_pilot")
    show = await showcase_enabled(org_id)
    db = get_db()
    pilot_taps = [
        t["id"]
        async for t in db.taps.find(
            {"building_id": PILOT_BUILDING_ID, "deployment_scope": {"$ne": "showcase"}},
            {"_id": 0, "id": 1},
        )
    ]
    # Fallback if tags not yet applied
    if not pilot_taps:
        pilot_taps = [
            t["id"]
            async for t in db.taps.find({"id": {"$in": ["tap_a", "tap_b", "tap_c"]}}, {"_id": 0, "id": 1})
        ]
    return {
        "mode": "showcase" if show else "pilot",
        "showcase_scale": show,
        "physical_pilot": {
            "building_id": PILOT_BUILDING_ID,
            "device_id": "device_01",
            "tap_ids": sorted(pilot_taps),
            "pipes": 3,
            "architecture": "1 ESP × 3 taps",
        },
        "note": (
            "Showcase Wing is demo-only for professor presentations. "
            "It does not change the physical pilot (3 pipes)."
        ),
    }


@data_router.post("/admin/separate-showcase")
async def admin_separate_showcase(user: dict = Depends(require_caps(CAP_ADMIN))):
    """Move Wave-2 demo assets into Showcase Wing and keep pilot at 3 taps."""
    result = await ensure_pilot_and_showcase_tagged(user.get("org_id", "org_pilot"))
    result["separated_by"] = user.get("email")
    return result
