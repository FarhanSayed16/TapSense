from app.db.mongo import get_db


async def ensure_indexes() -> None:
    db = get_db()
    await db.users.create_index("email", unique=True)
    await db.taps.create_index("id", unique=True)
    await db.devices.create_index("id", unique=True)
    await db.organizations.create_index("id", unique=True)
    await db.campuses.create_index("id", unique=True)
    await db.buildings.create_index("id", unique=True)
    await db.floors.create_index("id", unique=True)
    await db.zones.create_index("id", unique=True)
    await db.readings.create_index([("tap_id", 1), ("ts", -1)])
    await db.readings.create_index([("device_id", 1), ("ts", -1)])
    await db.readings.create_index("message_id", unique=True, sparse=True)
    await db.sessions.create_index([("tap_id", 1), ("started_at", -1)])
    await db.sessions.create_index("id", unique=True)
    await db.daily_aggregates.create_index([("tap_id", 1), ("date", 1)], unique=True)
