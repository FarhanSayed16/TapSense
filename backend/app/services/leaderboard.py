"""Phase 17 — weekly aggregates + leaderboard snapshots (social-norm, no shame)."""

from __future__ import annotations

from datetime import date, datetime, timedelta, timezone
from typing import Any, Literal
from zoneinfo import ZoneInfo

from app.core.config import get_settings
from app.db.mongo import get_db

Scope = Literal["tap", "zone", "floor", "building"]

DEFAULT_BOARD_ID = "board_pilot"
DEFAULT_BOARD = {
    "id": DEFAULT_BOARD_ID,
    "title": "Hostel — Weekly water",
    "subtitle": "Lowest use earns quiet recognition",
    "scope": "tap",
    "org_id": "org_pilot",
    "campus_id": "campus_main",
    "building_id": "building_hostel",
    "floor_id": None,
    "zone_id": None,
    "exclude_control": True,
    "public": True,
    "enabled": True,
}


def _tz() -> ZoneInfo:
    return ZoneInfo(get_settings().campus_timezone)


def _parse_day(value: str) -> date:
    return date.fromisoformat(value)


def week_bounds(day: date | None = None) -> tuple[date, date]:
    """Campus Mon–Sun week containing `day` (default: today)."""
    tz = _tz()
    if day is None:
        day = datetime.now(tz).date()
    # Monday = 0
    start = day - timedelta(days=day.weekday())
    end = start + timedelta(days=6)
    return start, end


def previous_week_bounds(day: date | None = None) -> tuple[date, date]:
    start, _ = week_bounds(day)
    prev_end = start - timedelta(days=1)
    return week_bounds(prev_end)


async def ensure_default_board() -> dict[str, Any]:
    db = get_db()
    existing = await db.leaderboard_boards.find_one({"id": DEFAULT_BOARD_ID}, {"_id": 0})
    if existing:
        return existing
    now = datetime.now(timezone.utc)
    doc = {**DEFAULT_BOARD, "created_at": now, "updated_at": now}
    await db.leaderboard_boards.insert_one(doc)
    doc.pop("_id", None)
    return doc


async def list_boards() -> list[dict[str, Any]]:
    await ensure_default_board()
    return [
        doc
        async for doc in get_db().leaderboard_boards.find({}, {"_id": 0}).sort("id", 1)
    ]


async def get_board(board_id: str) -> dict[str, Any] | None:
    await ensure_default_board()
    return await get_db().leaderboard_boards.find_one({"id": board_id}, {"_id": 0})


async def update_board(board_id: str, patch: dict[str, Any], updated_by: str | None = None) -> dict[str, Any]:
    board = await get_board(board_id)
    if not board:
        raise ValueError(f"unknown board_id: {board_id}")

    allowed = {
        "title",
        "subtitle",
        "scope",
        "building_id",
        "floor_id",
        "zone_id",
        "exclude_control",
        "public",
        "enabled",
    }
    updates = {k: patch[k] for k in allowed if k in patch and patch[k] is not None}
    if "scope" in updates and updates["scope"] not in ("tap", "zone", "floor", "building"):
        raise ValueError("scope must be tap|zone|floor|building")
    updates["updated_at"] = datetime.now(timezone.utc)
    updates["updated_by"] = updated_by
    await get_db().leaderboard_boards.update_one({"id": board_id}, {"$set": updates})
    out = await get_board(board_id)
    assert out is not None
    return out


async def compute_weekly_aggregates(
    week_start: str,
    week_end: str | None = None,
) -> dict[str, Any]:
    """Roll daily_aggregates into tap/zone/floor/building totals for a campus week."""
    start = _parse_day(week_start)
    end = _parse_day(week_end) if week_end else week_bounds(start)[1]
    if end < start:
        raise ValueError("week_end must be >= week_start")

    db = get_db()
    taps = [doc async for doc in db.taps.find({}, {"_id": 0})]

    daily = [
        doc
        async for doc in db.daily_aggregates.find(
            {"date": {"$gte": start.isoformat(), "$lte": end.isoformat()}},
            {"_id": 0},
        )
    ]

    tap_totals: dict[str, dict[str, Any]] = {}
    for t in taps:
        tap_totals[t["id"]] = {
            "entity_id": t["id"],
            "name": t.get("name", t["id"]),
            "scope": "tap",
            "liters": 0.0,
            "session_count": 0,
            "is_control": bool(t.get("is_control")),
            "zone_id": t.get("zone_id"),
            "floor_id": t.get("floor_id"),
            "building_id": t.get("building_id"),
        }

    for row in daily:
        tid = row.get("tap_id")
        if tid not in tap_totals:
            continue
        tap_totals[tid]["liters"] += float(row.get("liters", 0))
        tap_totals[tid]["session_count"] += int(row.get("session_count", 0))

    def _roll(level: Scope, key_field: str) -> list[dict[str, Any]]:
        buckets: dict[str, dict[str, Any]] = {}
        for t in tap_totals.values():
            eid = t.get(key_field)
            if not eid:
                continue
            bucket = buckets.setdefault(
                eid,
                {
                    "entity_id": eid,
                    "name": eid,
                    "scope": level,
                    "liters": 0.0,
                    "session_count": 0,
                    "is_control": False,
                    "tap_count": 0,
                    "control_tap_count": 0,
                },
            )
            bucket["liters"] += t["liters"]
            bucket["session_count"] += t["session_count"]
            bucket["tap_count"] += 1
            if t["is_control"]:
                bucket["control_tap_count"] += 1
        return list(buckets.values())

    zones = _roll("zone", "zone_id")
    floors = _roll("floor", "floor_id")
    buildings = _roll("building", "building_id")

    async def _name_fill(rows: list[dict[str, Any]], collection: str) -> None:
        for row in rows:
            doc = await db[collection].find_one({"id": row["entity_id"]}, {"_id": 0, "name": 1})
            if doc:
                row["name"] = doc.get("name", row["entity_id"])

    await _name_fill(zones, "zones")
    await _name_fill(floors, "floors")
    await _name_fill(buildings, "buildings")

    now = datetime.now(timezone.utc)
    # Persist tap-level weekly rows (repair/export friendly)
    await db.weekly_aggregates.delete_many(
        {"week_start": start.isoformat(), "week_end": end.isoformat(), "scope": "tap"}
    )
    for row in tap_totals.values():
        await db.weekly_aggregates.insert_one(
            {
                **row,
                "week_start": start.isoformat(),
                "week_end": end.isoformat(),
                "updated_at": now,
            }
        )

    return {
        "week_start": start.isoformat(),
        "week_end": end.isoformat(),
        "timezone": get_settings().campus_timezone,
        "taps": list(tap_totals.values()),
        "zones": zones,
        "floors": floors,
        "buildings": buildings,
        "generated_at": now.isoformat(),
    }


def _rank_entries(
    entries: list[dict[str, Any]],
    *,
    exclude_control: bool,
) -> list[dict[str, Any]]:
    rows = []
    for e in entries:
        if exclude_control and e.get("is_control"):
            continue
        # For rolled scopes, skip pure-control buckets if exclude_control
        if exclude_control and e.get("scope") != "tap":
            if e.get("tap_count") and e.get("control_tap_count") == e.get("tap_count"):
                continue
        rows.append(e)
    # Lowest liters wins (positive recognition)
    rows.sort(key=lambda r: (r["liters"], r["name"]))
    ranked = []
    for i, r in enumerate(rows, start=1):
        ranked.append(
            {
                "rank": i,
                "entity_id": r["entity_id"],
                "name": r["name"],
                "liters": round(float(r["liters"]), 3),
                "session_count": int(r.get("session_count", 0)),
                "is_control": bool(r.get("is_control", False)),
                "scope": r.get("scope"),
            }
        )
    return ranked


async def build_snapshot(
    board_id: str,
    week_start: str | None = None,
) -> dict[str, Any]:
    board = await get_board(board_id)
    if not board:
        raise ValueError(f"unknown board_id: {board_id}")

    if week_start:
        start, end = week_bounds(_parse_day(week_start))
    else:
        start, end = week_bounds()

    weekly = await compute_weekly_aggregates(start.isoformat(), end.isoformat())
    scope: Scope = board.get("scope") or "tap"
    pool = {
        "tap": weekly["taps"],
        "zone": weekly["zones"],
        "floor": weekly["floors"],
        "building": weekly["buildings"],
    }[scope]

    # Optional location filter for tap scope
    if scope == "tap":
        filtered = []
        for t in pool:
            if board.get("building_id") and t.get("building_id") != board["building_id"]:
                continue
            if board.get("floor_id") and t.get("floor_id") != board["floor_id"]:
                continue
            if board.get("zone_id") and t.get("zone_id") != board["zone_id"]:
                continue
            filtered.append(t)
        pool = filtered

    ranks = _rank_entries(pool, exclude_control=bool(board.get("exclude_control", True)))
    winner = ranks[0] if ranks else None
    now = datetime.now(timezone.utc)
    snap_id = f"{board_id}:{start.isoformat()}"
    doc = {
        "id": snap_id,
        "board_id": board_id,
        "title": board.get("title"),
        "subtitle": board.get("subtitle"),
        "scope": scope,
        "week_start": start.isoformat(),
        "week_end": end.isoformat(),
        "timezone": get_settings().campus_timezone,
        "exclude_control": bool(board.get("exclude_control", True)),
        "ranks": ranks,
        "winner": winner,
        "entry_count": len(ranks),
        "recognition": "Lowest use this week",
        "honesty": "Pilot board — descriptive ranks, not a powered study.",
        "generated_at": now,
        "public": bool(board.get("public", True)),
    }
    await get_db().leaderboard_snapshots.update_one(
        {"id": snap_id},
        {"$set": doc, "$setOnInsert": {"created_at": now}},
        upsert=True,
    )
    # JSON-safe
    out = {**doc, "generated_at": now.isoformat()}
    return out


async def get_snapshot(board_id: str, week_start: str | None = None) -> dict[str, Any] | None:
    if week_start:
        start, _ = week_bounds(_parse_day(week_start))
    else:
        start, _ = week_bounds()
    snap_id = f"{board_id}:{start.isoformat()}"
    doc = await get_db().leaderboard_snapshots.find_one({"id": snap_id}, {"_id": 0})
    if not doc:
        return None
    if isinstance(doc.get("generated_at"), datetime):
        doc["generated_at"] = doc["generated_at"].isoformat()
    return doc


async def get_or_build_snapshot(board_id: str, week_start: str | None = None) -> dict[str, Any]:
    existing = await get_snapshot(board_id, week_start)
    if existing:
        return existing
    return await build_snapshot(board_id, week_start)


async def public_board_view(board_id: str, week_start: str | None = None) -> dict[str, Any]:
    board = await get_board(board_id)
    if not board or not board.get("public") or not board.get("enabled", True):
        raise ValueError("board not available")
    snap = await get_or_build_snapshot(board_id, week_start)
    # Limited public fields — no device/control internals beyond rank list
    return {
        "board_id": board_id,
        "title": snap.get("title") or board.get("title"),
        "subtitle": snap.get("subtitle") or board.get("subtitle"),
        "week_start": snap["week_start"],
        "week_end": snap["week_end"],
        "timezone": snap["timezone"],
        "recognition": snap.get("recognition") or "Lowest use this week",
        "winner": snap.get("winner"),
        "ranks": [
            {
                "rank": r["rank"],
                "name": r["name"],
                "liters": r["liters"],
            }
            for r in snap.get("ranks", [])
        ],
        "generated_at": snap.get("generated_at"),
        "brand": "TapSense",
    }


async def refresh_all_boards(week_start: str | None = None) -> list[dict[str, Any]]:
    boards = await list_boards()
    out = []
    for b in boards:
        if not b.get("enabled", True):
            continue
        out.append(await build_snapshot(b["id"], week_start))
    return out
