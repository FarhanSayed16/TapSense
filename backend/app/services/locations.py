"""Phase 19 — location tree + multi-device registry (scale-out Wave 2)."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any, Literal
from zoneinfo import ZoneInfo

from app.core.config import get_settings
from app.db.mongo import get_db
from app.services.deployment import (
    SCOPE_PILOT,
    SCOPE_SHOWCASE,
    SHOWCASE_BUILDING_ID,
    filter_docs_by_scope,
    infer_scope,
    showcase_enabled,
)

Architecture = Literal["multi_tap", "single_tap"]


def _tz() -> ZoneInfo:
    return ZoneInfo(get_settings().campus_timezone)


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _device_status(last_seen: datetime | None, stale_after: int) -> str:
    if last_seen is None:
        return "unknown"
    if last_seen.tzinfo is None:
        last_seen = last_seen.replace(tzinfo=timezone.utc)
    age = (_now() - last_seen).total_seconds()
    return "online" if age <= stale_after else "stale"


async def get_location_tree(org_id: str = "org_pilot") -> dict[str, Any]:
    db = get_db()
    org = await db.organizations.find_one({"id": org_id}, {"_id": 0})
    if not org:
        raise ValueError("organization not found")

    campuses = [c async for c in db.campuses.find({"org_id": org_id}, {"_id": 0}).sort("id", 1)]
    buildings = [b async for b in db.buildings.find({"org_id": org_id}, {"_id": 0}).sort("id", 1)]
    floors = [f async for f in db.floors.find({"org_id": org_id}, {"_id": 0}).sort("id", 1)]
    zones = [z async for z in db.zones.find({"org_id": org_id}, {"_id": 0}).sort("id", 1)]
    taps = [t async for t in db.taps.find({"org_id": org_id}, {"_id": 0}).sort("id", 1)]
    devices = [d async for d in db.devices.find({"org_id": org_id}, {"_id": 0}).sort("id", 1)]

    # Keep pilot washroom clean unless showcase_scale is enabled
    if not await showcase_enabled(org_id):
        buildings = [
            b
            for b in buildings
            if infer_scope(b, kind="building") != SCOPE_SHOWCASE
            and b.get("id") != SHOWCASE_BUILDING_ID
        ]
        allowed_buildings = {b["id"] for b in buildings}
        floors = [f for f in floors if f.get("building_id") in allowed_buildings]
        zones = [z for z in zones if z.get("building_id") in allowed_buildings]
        taps = await filter_docs_by_scope(taps, kind="tap", org_id=org_id)
        devices = await filter_docs_by_scope(devices, kind="device", org_id=org_id)

    stale_after = get_settings().device_stale_seconds
    device_by_id = {d["id"]: d for d in devices}

    def tap_node(t: dict[str, Any]) -> dict[str, Any]:
        did = t.get("device_id")
        dev = device_by_id.get(did) if did else None
        return {
            "id": t["id"],
            "name": t.get("name"),
            "is_control": bool(t.get("is_control")),
            "device_id": did,
            "architecture": (dev or {}).get("architecture") or ("multi_tap" if did == "device_01" else "single_tap"),
        }

    tree_campuses = []
    for campus in campuses:
        c_buildings = []
        for building in [b for b in buildings if b.get("campus_id") == campus["id"]]:
            b_floors = []
            for floor in [f for f in floors if f.get("building_id") == building["id"]]:
                f_zones = []
                for zone in [z for z in zones if z.get("floor_id") == floor["id"]]:
                    z_taps = [tap_node(t) for t in taps if t.get("zone_id") == zone["id"]]
                    f_zones.append(
                        {
                            "id": zone["id"],
                            "name": zone.get("name"),
                            "tap_count": len(z_taps),
                            "taps": z_taps,
                        }
                    )
                b_floors.append(
                    {
                        "id": floor["id"],
                        "name": floor.get("name"),
                        "zone_count": len(f_zones),
                        "zones": f_zones,
                    }
                )
            c_buildings.append(
                {
                    "id": building["id"],
                    "name": building.get("name"),
                    "floor_count": len(b_floors),
                    "floors": b_floors,
                }
            )
        tree_campuses.append(
            {
                "id": campus["id"],
                "name": campus.get("name"),
                "buildings": c_buildings,
            }
        )

    fleet = []
    for d in devices:
        last = d.get("last_seen_at")
        fleet.append(
            {
                "id": d["id"],
                "name": d.get("name"),
                "architecture": d.get("architecture")
                or ("multi_tap" if len(d.get("tap_ids") or []) > 1 else "single_tap"),
                "tap_ids": list(d.get("tap_ids") or []),
                "firmware_version": d.get("firmware_version"),
                "status": _device_status(last, stale_after),
                "last_seen_at": last.isoformat() if isinstance(last, datetime) else last,
                "wifi_rssi": d.get("wifi_rssi"),
                "building_id": d.get("building_id"),
                "floor_id": d.get("floor_id"),
                "zone_id": d.get("zone_id"),
            }
        )

    return {
        "org": {"id": org["id"], "name": org.get("name")},
        "deployment": {
            "mode": "showcase" if await showcase_enabled(org_id) else "pilot",
            "showcase_scale": await showcase_enabled(org_id),
            "pilot_taps": 3,
            "note": "Physical pilot is 1 ESP × 3 taps. Showcase Wing is demo-only.",
        },
        "campuses": tree_campuses,
        "summary": {
            "buildings": len(buildings),
            "floors": len(floors),
            "zones": len(zones),
            "taps": len(taps),
            "devices": len(devices),
            "control_taps": sum(1 for t in taps if t.get("is_control")),
            "single_tap_devices": sum(
                1
                for d in devices
                if (d.get("architecture") == "single_tap")
                or (d.get("architecture") is None and len(d.get("tap_ids") or []) == 1)
            ),
        },
        "devices": fleet,
        "timezone": get_settings().campus_timezone,
    }


async def list_buildings(org_id: str = "org_pilot") -> list[dict[str, Any]]:
    db = get_db()
    show_showcase = await showcase_enabled(org_id)
    out = []
    async for b in db.buildings.find({"org_id": org_id}, {"_id": 0}).sort("id", 1):
        if not show_showcase and (
            infer_scope(b, kind="building") == SCOPE_SHOWCASE or b.get("id") == SHOWCASE_BUILDING_ID
        ):
            continue
        floors = await db.floors.count_documents({"building_id": b["id"]})
        taps = await db.taps.count_documents({"building_id": b["id"]})
        out.append({**b, "floor_count": floors, "tap_count": taps})
    return out


async def get_building_dashboard(building_id: str) -> dict[str, Any]:
    db = get_db()
    building = await db.buildings.find_one({"id": building_id}, {"_id": 0})
    if not building:
        raise ValueError("building not found")
    floors = [f async for f in db.floors.find({"building_id": building_id}, {"_id": 0}).sort("id", 1)]
    zones = [z async for z in db.zones.find({"building_id": building_id}, {"_id": 0}).sort("id", 1)]
    taps = [t async for t in db.taps.find({"building_id": building_id}, {"_id": 0}).sort("id", 1)]
    devices = [
        d
        async for d in db.devices.find(
            {"$or": [{"building_id": building_id}, {"tap_ids": {"$in": [t["id"] for t in taps]}}]},
            {"_id": 0},
        )
    ]
    today = datetime.now(_tz()).date().isoformat()
    week_start = (datetime.now(_tz()).date() - timedelta(days=6)).isoformat()
    tap_ids = [t["id"] for t in taps]
    liters_today = 0.0
    liters_week = 0.0
    if tap_ids:
        async for row in db.daily_aggregates.find({"tap_id": {"$in": tap_ids}, "date": today}):
            liters_today += float(row.get("liters", 0))
        async for row in db.daily_aggregates.find(
            {"tap_id": {"$in": tap_ids}, "date": {"$gte": week_start}}
        ):
            liters_week += float(row.get("liters", 0))

    stale_after = get_settings().device_stale_seconds
    online = sum(1 for d in devices if _device_status(d.get("last_seen_at"), stale_after) == "online")

    return {
        "building": building,
        "floors": floors,
        "zones": zones,
        "taps": taps,
        "devices": [
            {
                "id": d["id"],
                "name": d.get("name"),
                "architecture": d.get("architecture")
                or ("multi_tap" if len(d.get("tap_ids") or []) > 1 else "single_tap"),
                "tap_ids": d.get("tap_ids") or [],
                "firmware_version": d.get("firmware_version"),
                "status": _device_status(d.get("last_seen_at"), stale_after),
            }
            for d in devices
        ],
        "metrics": {
            "liters_today": round(liters_today, 3),
            "liters_week": round(liters_week, 3),
            "tap_count": len(taps),
            "zone_count": len(zones),
            "devices_online": online,
            "devices_total": len(devices),
        },
        "timezone": get_settings().campus_timezone,
    }


async def get_floor_dashboard(floor_id: str) -> dict[str, Any]:
    db = get_db()
    floor = await db.floors.find_one({"id": floor_id}, {"_id": 0})
    if not floor:
        raise ValueError("floor not found")
    zones = [z async for z in db.zones.find({"floor_id": floor_id}, {"_id": 0}).sort("id", 1)]
    taps = [t async for t in db.taps.find({"floor_id": floor_id}, {"_id": 0}).sort("id", 1)]
    today = datetime.now(_tz()).date().isoformat()
    tap_ids = [t["id"] for t in taps]
    liters_today = 0.0
    if tap_ids:
        async for row in db.daily_aggregates.find({"tap_id": {"$in": tap_ids}, "date": today}):
            liters_today += float(row.get("liters", 0))
    return {
        "floor": floor,
        "zones": zones,
        "taps": taps,
        "metrics": {"liters_today": round(liters_today, 3), "tap_count": len(taps), "zone_count": len(zones)},
    }


async def get_zone_dashboard(zone_id: str) -> dict[str, Any]:
    db = get_db()
    zone = await db.zones.find_one({"id": zone_id}, {"_id": 0})
    if not zone:
        raise ValueError("zone not found")
    taps = [t async for t in db.taps.find({"zone_id": zone_id}, {"_id": 0}).sort("id", 1)]
    today = datetime.now(_tz()).date().isoformat()
    tap_ids = [t["id"] for t in taps]
    liters_today = 0.0
    if tap_ids:
        async for row in db.daily_aggregates.find({"tap_id": {"$in": tap_ids}, "date": today}):
            liters_today += float(row.get("liters", 0))
    devices = []
    seen = set()
    for t in taps:
        did = t.get("device_id")
        if did and did not in seen:
            seen.add(did)
            d = await db.devices.find_one({"id": did}, {"_id": 0})
            if d:
                devices.append(d)
    return {
        "zone": zone,
        "taps": taps,
        "devices": devices,
        "metrics": {"liters_today": round(liters_today, 3), "tap_count": len(taps)},
    }


async def create_location_node(
    kind: Literal["building", "floor", "zone"],
    payload: dict[str, Any],
) -> dict[str, Any]:
    db = get_db()
    now = _now()
    node_id = payload.get("id")
    name = (payload.get("name") or "").strip()
    if not node_id or not name:
        raise ValueError("id and name are required")

    if kind == "building":
        scope = payload.get("deployment_scope") or (
            SCOPE_SHOWCASE if node_id == SHOWCASE_BUILDING_ID else SCOPE_PILOT
        )
        doc = {
            "id": node_id,
            "name": name,
            "org_id": payload.get("org_id") or "org_pilot",
            "campus_id": payload.get("campus_id") or "campus_main",
            "deployment_scope": scope,
            "created_at": now,
            "updated_at": now,
        }
        await db.buildings.update_one({"id": node_id}, {"$set": doc}, upsert=True)
        return doc

    if kind == "floor":
        building_id = payload.get("building_id")
        if not building_id:
            raise ValueError("building_id required")
        building = await db.buildings.find_one({"id": building_id})
        if not building:
            raise ValueError("building not found")
        doc = {
            "id": node_id,
            "name": name,
            "org_id": building["org_id"],
            "campus_id": building["campus_id"],
            "building_id": building_id,
            "deployment_scope": building.get("deployment_scope")
            or (SCOPE_SHOWCASE if building_id == SHOWCASE_BUILDING_ID else SCOPE_PILOT),
            "created_at": now,
            "updated_at": now,
        }
        await db.floors.update_one({"id": node_id}, {"$set": doc}, upsert=True)
        return doc

    # zone
    floor_id = payload.get("floor_id")
    if not floor_id:
        raise ValueError("floor_id required")
    floor = await db.floors.find_one({"id": floor_id})
    if not floor:
        raise ValueError("floor not found")
    doc = {
        "id": node_id,
        "name": name,
        "org_id": floor["org_id"],
        "campus_id": floor["campus_id"],
        "building_id": floor["building_id"],
        "floor_id": floor_id,
        "deployment_scope": floor.get("deployment_scope")
        or (SCOPE_SHOWCASE if floor.get("building_id") == SHOWCASE_BUILDING_ID else SCOPE_PILOT),
        "created_at": now,
        "updated_at": now,
    }
    await db.zones.update_one({"id": node_id}, {"$set": doc}, upsert=True)
    return doc


async def register_device(payload: dict[str, Any]) -> dict[str, Any]:
    """Register or update a device. Wave-2 prefers architecture=single_tap with one tap_id."""
    db = get_db()
    device_id = payload.get("id")
    if not device_id:
        raise ValueError("id required")
    tap_ids = list(payload.get("tap_ids") or [])
    architecture: Architecture = payload.get("architecture") or (
        "single_tap" if len(tap_ids) <= 1 else "multi_tap"
    )
    if architecture == "single_tap" and len(tap_ids) > 1:
        raise ValueError("single_tap devices may bind at most one tap_id")
    if architecture == "multi_tap" and len(tap_ids) < 1:
        raise ValueError("multi_tap devices need at least one tap_id")

    for tid in tap_ids:
        tap = await db.taps.find_one({"id": tid})
        if not tap:
            raise ValueError(f"unknown tap_id: {tid}")

    now = _now()
    building_id = payload.get("building_id")
    scope = payload.get("deployment_scope") or (
        SCOPE_SHOWCASE if building_id == SHOWCASE_BUILDING_ID else SCOPE_PILOT
    )
    topic_prefix = "showcase" if scope == SCOPE_SHOWCASE else "pilot"
    doc = {
        "id": device_id,
        "name": payload.get("name") or device_id,
        "org_id": payload.get("org_id") or "org_pilot",
        "tap_ids": tap_ids,
        "architecture": architecture,
        "firmware_version": payload.get("firmware_version") or "0.2.0-wave2",
        "building_id": building_id,
        "floor_id": payload.get("floor_id"),
        "zone_id": payload.get("zone_id"),
        "deployment_scope": scope,
        "mqtt_topic": payload.get("mqtt_topic")
        or f"tapsense/{topic_prefix}/{device_id}/telemetry",
        "updated_at": now,
    }
    existing = await db.devices.find_one({"id": device_id})
    if not existing:
        doc["created_at"] = now
        doc["last_seen_at"] = None
    await db.devices.update_one({"id": device_id}, {"$set": doc}, upsert=True)

    # Bind taps → device
    for tid in tap_ids:
        await db.taps.update_one({"id": tid}, {"$set": {"device_id": device_id, "updated_at": now}})

    return await db.devices.find_one({"id": device_id}, {"_id": 0})


async def register_tap(payload: dict[str, Any]) -> dict[str, Any]:
    db = get_db()
    tap_id = payload.get("id")
    zone_id = payload.get("zone_id")
    if not tap_id or not zone_id:
        raise ValueError("id and zone_id required")
    zone = await db.zones.find_one({"id": zone_id})
    if not zone:
        raise ValueError("zone not found")
    now = _now()
    doc = {
        "id": tap_id,
        "name": payload.get("name") or tap_id,
        "org_id": zone["org_id"],
        "campus_id": zone["campus_id"],
        "building_id": zone["building_id"],
        "floor_id": zone["floor_id"],
        "zone_id": zone_id,
        "deployment_scope": zone.get("deployment_scope")
        or (SCOPE_SHOWCASE if zone.get("building_id") == SHOWCASE_BUILDING_ID else SCOPE_PILOT),
        "is_control": bool(payload.get("is_control", False)),
        "device_id": payload.get("device_id"),
        "pulses_per_liter": float(payload.get("pulses_per_liter") or 450.0),
        "updated_at": now,
    }
    existing = await db.taps.find_one({"id": tap_id})
    if not existing:
        doc["created_at"] = now
    await db.taps.update_one({"id": tap_id}, {"$set": doc}, upsert=True)
    return await db.taps.find_one({"id": tap_id}, {"_id": 0})
