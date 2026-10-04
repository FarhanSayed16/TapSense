"""Pilot vs showcase deployment separation.

Real hardware today: 1 ESP × 3 taps (pilot).
Wave-2 / multi-floor registry data is tagged `deployment_scope=showcase`
and lives under `building_showcase` so it cannot overlap the pilot washroom.

Org feature flag `showcase_scale` (default False) controls whether showcase
assets appear in lists, overview trees, and analytics.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from app.db.mongo import get_db
from app.services.org import DEFAULT_FLAGS, get_org

SCOPE_PILOT = "pilot"
SCOPE_SHOWCASE = "showcase"

PILOT_BUILDING_ID = "building_hostel"
SHOWCASE_BUILDING_ID = "building_showcase"

PILOT_TAP_IDS = frozenset({"tap_a", "tap_b", "tap_c"})
PILOT_DEVICE_IDS = frozenset({"device_01"})
SHOWCASE_TAP_IDS = frozenset({"tap_d", "tap_e"})
SHOWCASE_DEVICE_IDS = frozenset({"device_02", "device_03"})


async def showcase_enabled(org_id: str = "org_pilot") -> bool:
    try:
        org = await get_org(org_id)
    except ValueError:
        return bool(DEFAULT_FLAGS.get("showcase_scale", False))
    flags = org.get("feature_flags") or {}
    return bool(flags.get("showcase_scale", False))


def infer_scope(doc: dict[str, Any] | None, *, kind: str = "tap") -> str:
    if not doc:
        return SCOPE_PILOT
    explicit = doc.get("deployment_scope")
    if explicit in (SCOPE_PILOT, SCOPE_SHOWCASE):
        return explicit
    entity_id = doc.get("id") or ""
    if kind == "device":
        if entity_id in SHOWCASE_DEVICE_IDS:
            return SCOPE_SHOWCASE
        if entity_id in PILOT_DEVICE_IDS:
            return SCOPE_PILOT
    if kind == "tap":
        if entity_id in SHOWCASE_TAP_IDS:
            return SCOPE_SHOWCASE
        if entity_id in PILOT_TAP_IDS:
            return SCOPE_PILOT
    if doc.get("id") == SHOWCASE_BUILDING_ID or doc.get("building_id") == SHOWCASE_BUILDING_ID:
        return SCOPE_SHOWCASE
    return SCOPE_PILOT


async def visible_scope_values(org_id: str = "org_pilot") -> list[str] | None:
    """None = all scopes. List = only these scopes are visible."""
    if await showcase_enabled(org_id):
        return None
    return [SCOPE_PILOT]


def mongo_scope_filter(scopes: list[str] | None) -> dict[str, Any]:
    """Mongo filter fragment for deployment_scope-aware collections."""
    if scopes is None:
        return {}
    # Include legacy docs with missing scope as pilot
    return {
        "$or": [
            {"deployment_scope": {"$in": scopes}},
            {"deployment_scope": {"$exists": False}},
            {"deployment_scope": None},
        ]
    }


async def filter_docs_by_scope(
    docs: list[dict[str, Any]],
    *,
    kind: str = "tap",
    org_id: str = "org_pilot",
) -> list[dict[str, Any]]:
    scopes = await visible_scope_values(org_id)
    if scopes is None:
        return docs
    allowed = set(scopes)
    return [d for d in docs if infer_scope(d, kind=kind) in allowed]


async def ensure_pilot_and_showcase_tagged(org_id: str = "org_pilot") -> dict[str, Any]:
    """Idempotent: tag pilot assets, move Wave-2 demo into showcase building."""
    db = get_db()
    now = datetime.now(timezone.utc)

    # Tag pilot building / floor / zone / taps / device
    await db.buildings.update_one(
        {"id": PILOT_BUILDING_ID},
        {"$set": {"deployment_scope": SCOPE_PILOT, "name": "Hostel Block (Pilot)"}},
    )
    await db.floors.update_one(
        {"id": "floor_1"},
        {"$set": {"deployment_scope": SCOPE_PILOT}},
    )
    await db.zones.update_one(
        {"id": "zone_washroom"},
        {"$set": {"deployment_scope": SCOPE_PILOT}},
    )
    for tid in PILOT_TAP_IDS:
        await db.taps.update_one(
            {"id": tid},
            {"$set": {"deployment_scope": SCOPE_PILOT, "building_id": PILOT_BUILDING_ID}},
        )
    await db.devices.update_one(
        {"id": "device_01"},
        {
            "$set": {
                "deployment_scope": SCOPE_PILOT,
                "building_id": PILOT_BUILDING_ID,
                "architecture": "multi_tap",
                "tap_ids": ["tap_a", "tap_b", "tap_c"],
            }
        },
    )

    # Ensure showcase building exists
    campus = await db.campuses.find_one({"id": "campus_main"}, {"_id": 0})
    campus_id = (campus or {}).get("id") or "campus_main"
    await db.buildings.update_one(
        {"id": SHOWCASE_BUILDING_ID},
        {
            "$set": {
                "id": SHOWCASE_BUILDING_ID,
                "name": "Showcase Wing (Demo only)",
                "org_id": org_id,
                "campus_id": campus_id,
                "deployment_scope": SCOPE_SHOWCASE,
                "notes": "Synthetic scale-out for professor demos — not physical pilot hardware",
            },
            "$setOnInsert": {"created_at": now},
        },
        upsert=True,
    )

    # Move floor_2 / zone / taps / devices into showcase building
    await db.floors.update_one(
        {"id": "floor_2"},
        {
            "$set": {
                "building_id": SHOWCASE_BUILDING_ID,
                "deployment_scope": SCOPE_SHOWCASE,
                "org_id": org_id,
                "campus_id": campus_id,
                "name": "Floor 2 (Showcase)",
            }
        },
        upsert=True,
    )
    await db.zones.update_one(
        {"id": "zone_washroom_f2"},
        {
            "$set": {
                "building_id": SHOWCASE_BUILDING_ID,
                "floor_id": "floor_2",
                "deployment_scope": SCOPE_SHOWCASE,
                "org_id": org_id,
                "campus_id": campus_id,
                "name": "Washroom F2 (Showcase)",
            }
        },
        upsert=True,
    )

    for tid, name in (("tap_d", "Tap D (Showcase)"), ("tap_e", "Tap E (Showcase)")):
        await db.taps.update_one(
            {"id": tid},
            {
                "$set": {
                    "name": name,
                    "org_id": org_id,
                    "campus_id": campus_id,
                    "building_id": SHOWCASE_BUILDING_ID,
                    "floor_id": "floor_2",
                    "zone_id": "zone_washroom_f2",
                    "is_control": False,
                    "deployment_scope": SCOPE_SHOWCASE,
                }
            },
        )

    for did, tid, name in (
        ("device_02", "tap_d", "ESP Tap D (showcase)"),
        ("device_03", "tap_e", "ESP Tap E (showcase)"),
    ):
        await db.devices.update_one(
            {"id": did},
            {
                "$set": {
                    "name": name,
                    "org_id": org_id,
                    "tap_ids": [tid],
                    "architecture": "single_tap",
                    "building_id": SHOWCASE_BUILDING_ID,
                    "floor_id": "floor_2",
                    "zone_id": "zone_washroom_f2",
                    "deployment_scope": SCOPE_SHOWCASE,
                    "mqtt_topic": f"tapsense/showcase/{did}/telemetry",
                }
            },
        )
        await db.taps.update_one({"id": tid}, {"$set": {"device_id": did}})

    # Keep showcase_scale off unless an admin already opted into professor demo mode
    org = await db.organizations.find_one({"id": org_id})
    existing_flags = (org or {}).get("feature_flags") or {}
    flags = {**DEFAULT_FLAGS, **existing_flags}
    if "showcase_scale" not in existing_flags:
        flags["showcase_scale"] = False
    await db.organizations.update_one(
        {"id": org_id},
        {"$set": {"feature_flags": flags}},
    )

    pilot_taps = await db.taps.count_documents(
        {"building_id": PILOT_BUILDING_ID, "deployment_scope": SCOPE_PILOT}
    )
    showcase_taps = await db.taps.count_documents({"deployment_scope": SCOPE_SHOWCASE})
    return {
        "pilot_building": PILOT_BUILDING_ID,
        "showcase_building": SHOWCASE_BUILDING_ID,
        "pilot_taps": pilot_taps,
        "showcase_taps": showcase_taps,
        "showcase_scale": flags.get("showcase_scale", False),
    }
