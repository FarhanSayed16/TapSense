"""Seed pilot hierarchy, taps, device, and admin user.

Usage (from backend/):
  .\\.venv\\Scripts\\python -m scripts.seed
"""

from __future__ import annotations

import asyncio
import sys
from datetime import datetime, timezone
from pathlib import Path

# Allow `python -m scripts.seed` from backend/
ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from app.core.config import get_settings
from app.core.security import hash_password
from app.db.indexes import ensure_indexes
from app.db.mongo import close_db, get_db, ping_db
from app.services.deployment import ensure_pilot_and_showcase_tagged
from app.services.org import DEFAULT_FLAGS, ensure_demo_roles

NOW = datetime.now(timezone.utc)


async def upsert(collection: str, doc_id: str, doc: dict) -> None:
    db = get_db()
    payload = {**doc, "id": doc_id, "updated_at": NOW}
    payload.setdefault("created_at", NOW)
    await db[collection].update_one({"id": doc_id}, {"$set": payload}, upsert=True)


async def seed() -> None:
    settings = get_settings()
    if not await ping_db():
        raise SystemExit(
            "MongoDB not reachable. Start Docker (`tapsense-mongo`) or set MONGODB_URI in .env"
        )

    await ensure_indexes()

    await upsert(
        "organizations",
        "org_pilot",
        {
            "name": "Pilot College",
            "timezone": settings.campus_timezone,
            "feature_flags": DEFAULT_FLAGS,
        },
    )
    await upsert(
        "campuses",
        "campus_main",
        {"name": "Main Campus", "org_id": "org_pilot"},
    )
    await upsert(
        "buildings",
        "building_hostel",
        {
            "name": "Hostel Block (Pilot)",
            "org_id": "org_pilot",
            "campus_id": "campus_main",
            "deployment_scope": "pilot",
        },
    )
    await upsert(
        "floors",
        "floor_1",
        {
            "name": "Floor 1",
            "org_id": "org_pilot",
            "campus_id": "campus_main",
            "building_id": "building_hostel",
            "deployment_scope": "pilot",
        },
    )
    await upsert(
        "zones",
        "zone_washroom",
        {
            "name": "Washroom",
            "org_id": "org_pilot",
            "campus_id": "campus_main",
            "building_id": "building_hostel",
            "floor_id": "floor_1",
            "deployment_scope": "pilot",
        },
    )

    taps = [
        ("tap_a", "Tap A (Control)", True, 450.0),
        ("tap_b", "Tap B", False, 450.0),
        ("tap_c", "Tap C", False, 450.0),
    ]
    for tap_id, name, is_control, ppl in taps:
        await upsert(
            "taps",
            tap_id,
            {
                "name": name,
                "org_id": "org_pilot",
                "campus_id": "campus_main",
                "building_id": "building_hostel",
                "floor_id": "floor_1",
                "zone_id": "zone_washroom",
                "is_control": is_control,
                "device_id": "device_01",
                "pulses_per_liter": ppl,
                "deployment_scope": "pilot",
            },
        )

    await upsert(
        "devices",
        "device_01",
        {
            "name": "Washroom ESP Pilot",
            "org_id": "org_pilot",
            "tap_ids": ["tap_a", "tap_b", "tap_c"],
            "architecture": "multi_tap",
            "deployment_scope": "pilot",
            "building_id": "building_hostel",
            "floor_id": "floor_1",
            "zone_id": "zone_washroom",
            "mqtt_topic": "tapsense/pilot/device_01/telemetry",
            "firmware_version": "0.1.0-pilot",
            "last_seen_at": None,
        },
    )

    # Product science phase (0=silent baseline, 1=visibility on B/C)
    await upsert(
        "pilot_settings",
        "pilot_main",
        {"product_phase": 0},
    )

    admin_email = settings.admin_email.lower()
    db = get_db()
    existing = await db.users.find_one({"email": admin_email})
    user_doc = {
        "email": admin_email,
        "name": settings.admin_name,
        "role": "org_admin",
        "org_id": "org_pilot",
        "is_active": True,
        "password_hash": hash_password(settings.admin_password),
        "updated_at": NOW,
    }
    if existing:
        await db.users.update_one({"email": admin_email}, {"$set": user_doc})
    else:
        user_doc["created_at"] = NOW
        await db.users.insert_one(user_doc)

    await ensure_demo_roles("org_pilot")
    await ensure_pilot_and_showcase_tagged("org_pilot")

    print("Seed OK")
    print(f"  org=org_pilot · taps=tap_a(control), tap_b, tap_c · device=device_01")
    print(f"  admin={admin_email} / (password from ADMIN_PASSWORD in .env)")
    print("  facilities@tapsense.app · viewer@tapsense.app (same ADMIN_PASSWORD)")
    print("  deployment=pilot (3 pipes). Showcase Wing stays hidden until showcase_scale=true")


async def main() -> None:
    try:
        await seed()
    finally:
        await close_db()


if __name__ == "__main__":
    asyncio.run(main())
