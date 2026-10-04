"""Seed Wave-2 *showcase* scale demo (separate from physical pilot).

Usage (from backend/):
  .\\.venv\\Scripts\\python -m scripts.seed_wave2

Creates Showcase Wing with Floor 2 + tap_d/e + device_02/03.
Does NOT add taps into the pilot hostel washroom.
Physical pilot remains device_01 × tap_a/b/c.

Showcase assets are hidden in the UI until org flag showcase_scale=true.
"""

from __future__ import annotations

import asyncio
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from app.db.mongo import close_db, get_db, ping_db
from app.services.deployment import (
    SCOPE_SHOWCASE,
    SHOWCASE_BUILDING_ID,
    ensure_pilot_and_showcase_tagged,
)
from app.services.locations import create_location_node, register_device, register_tap
from app.services.org import ensure_demo_roles

NOW = datetime.now(timezone.utc)


async def seed_wave2() -> None:
    if not await ping_db():
        raise SystemExit("MongoDB not reachable")

    db = get_db()
    # Keep pilot ESP clearly marked
    await db.devices.update_one(
        {"id": "device_01"},
        {
            "$set": {
                "architecture": "multi_tap",
                "deployment_scope": "pilot",
                "building_id": "building_hostel",
                "floor_id": "floor_1",
                "zone_id": "zone_washroom",
                "mqtt_topic": "tapsense/pilot/device_01/telemetry",
                "tap_ids": ["tap_a", "tap_b", "tap_c"],
                "updated_at": NOW,
            }
        },
    )

    await create_location_node(
        "building",
        {
            "id": SHOWCASE_BUILDING_ID,
            "name": "Showcase Wing (Demo only)",
            "deployment_scope": SCOPE_SHOWCASE,
        },
    )
    await create_location_node(
        "floor",
        {
            "id": "floor_2",
            "name": "Floor 2 (Showcase)",
            "building_id": SHOWCASE_BUILDING_ID,
        },
    )
    await create_location_node(
        "zone",
        {
            "id": "zone_washroom_f2",
            "name": "Washroom F2 (Showcase)",
            "floor_id": "floor_2",
        },
    )

    await register_tap(
        {
            "id": "tap_d",
            "name": "Tap D (Showcase)",
            "zone_id": "zone_washroom_f2",
            "is_control": False,
            "pulses_per_liter": 450.0,
        }
    )
    await register_tap(
        {
            "id": "tap_e",
            "name": "Tap E (Showcase)",
            "zone_id": "zone_washroom_f2",
            "is_control": False,
            "pulses_per_liter": 450.0,
        }
    )

    await register_device(
        {
            "id": "device_02",
            "name": "ESP Tap D (showcase)",
            "tap_ids": ["tap_d"],
            "architecture": "single_tap",
            "firmware_version": "0.2.0-wave2",
            "building_id": SHOWCASE_BUILDING_ID,
            "floor_id": "floor_2",
            "zone_id": "zone_washroom_f2",
            "deployment_scope": SCOPE_SHOWCASE,
        }
    )
    await register_device(
        {
            "id": "device_03",
            "name": "ESP Tap E (showcase)",
            "tap_ids": ["tap_e"],
            "architecture": "single_tap",
            "firmware_version": "0.2.0-wave2",
            "building_id": SHOWCASE_BUILDING_ID,
            "floor_id": "floor_2",
            "zone_id": "zone_washroom_f2",
            "deployment_scope": SCOPE_SHOWCASE,
        }
    )

    result = await ensure_pilot_and_showcase_tagged("org_pilot")
    await ensure_demo_roles("org_pilot")

    print("Wave-2 SHOWCASE seed OK (separate from physical pilot)")
    print(f"  pilot building: building_hostel — taps a/b/c — device_01")
    print(f"  showcase building: {SHOWCASE_BUILDING_ID} — taps d/e — device_02/03")
    print(f"  showcase_scale flag: {result.get('showcase_scale')} (OFF = professors see pilot only)")
    print("  Enable for demos: Settings → Organization → showcase_scale")


async def main() -> None:
    try:
        await seed_wave2()
    finally:
        await close_db()


if __name__ == "__main__":
    asyncio.run(main())
