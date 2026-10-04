from __future__ import annotations

import logging
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any
from zoneinfo import ZoneInfo

from fastapi import HTTPException, status

from app.core.config import get_settings
from app.db.mongo import get_db
from app.schemas.ingest import TelemetryIn, TelemetryResult

logger = logging.getLogger("tapsense.ingest")

def _now() -> datetime:
    return datetime.now(timezone.utc)


def _campus_date(when: datetime | None = None) -> str:
    settings = get_settings()
    tz = ZoneInfo(settings.campus_timezone)
    moment = when or _now()
    if moment.tzinfo is None:
        moment = moment.replace(tzinfo=timezone.utc)
    return moment.astimezone(tz).date().isoformat()


def _parse_ts(raw: int | float | None) -> datetime:
    if raw is None:
        return _now()
    # firmware currently sends millis() uptime — treat small values as relative, use server time
    # Prefer epoch seconds/ms if clearly absolute
    try:
        value = float(raw)
    except (TypeError, ValueError):
        return _now()
    if value > 1_000_000_000_000:  # ms epoch
        return datetime.fromtimestamp(value / 1000.0, tz=timezone.utc)
    if value > 1_000_000_000:  # sec epoch
        return datetime.fromtimestamp(value, tz=timezone.utc)
    return _now()


async def process_telemetry(payload: TelemetryIn) -> TelemetryResult:
    settings = get_settings()
    db = get_db()

    device = await db.devices.find_one({"id": payload.device_id})
    if not device:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Unknown device_id")

    # Heartbeat / status — update last-seen only
    if payload.type == "status" or (payload.tap_id is None and payload.liters_delta == 0 and not payload.session_end):
        status_set: dict[str, Any] = {
            "last_seen_at": _now(),
            "wifi_rssi": payload.wifi_rssi,
            "updated_at": _now(),
        }
        # Optional firmware version on status heartbeats (fleet tracking)
        fw = getattr(payload, "firmware_version", None)
        if fw:
            status_set["firmware_version"] = fw
        await db.devices.update_one({"id": payload.device_id}, {"$set": status_set})
        return TelemetryResult(accepted=True, detail="status")

    # Wave-2+: any registered tap bound to this device (not hard-coded tap_a/b/c)
    tap_doc = await db.taps.find_one({"id": payload.tap_id}, {"_id": 0, "id": 1})
    if not tap_doc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid tap_id")

    if payload.tap_id not in set(device.get("tap_ids", [])):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Tap not bound to device")

    message_id = payload.message_id or f"auto-{payload.device_id}-{payload.tap_id}-{uuid.uuid4()}"
    existing = await db.readings.find_one({"message_id": message_id}, {"_id": 0, "id": 1})
    if existing:
        return TelemetryResult(
            accepted=True,
            duplicate=True,
            detail="duplicate message_id",
            reading_id=existing.get("id"),
        )

    event_ts = _parse_ts(payload.ts)
    # Idle / session timing must use server clock — ESP NTP can jump and split sessions
    server_now = _now()
    reading_id = str(uuid.uuid4())
    reading_doc = {
        "id": reading_id,
        "message_id": message_id,
        "device_id": payload.device_id,
        "tap_id": payload.tap_id,
        "ts": event_ts,
        "liters_delta": float(payload.liters_delta or 0.0),
        "session_liters": payload.session_liters,
        "session_end": bool(payload.session_end),
        "created_at": server_now,
    }
    try:
        await db.readings.insert_one(reading_doc)
    except Exception as exc:
        # unique index race
        if "duplicate" in str(exc).lower() or getattr(exc, "code", None) == 11000:
            return TelemetryResult(accepted=True, duplicate=True, detail="duplicate message_id")
        raise

    await db.devices.update_one(
        {"id": payload.device_id},
        {"$set": {"last_seen_at": _now(), "updated_at": _now()}},
    )

    session_id: str | None = None
    session_closed = False
    daily_date: str | None = None

    open_session = await db.sessions.find_one(
        {"tap_id": payload.tap_id, "ended_at": None},
        {"_id": 0},
    )

    liters_delta = float(payload.liters_delta or 0.0)

    if liters_delta > 0:
        if not open_session:
            session_id = str(uuid.uuid4())
            open_session = {
                "id": session_id,
                "tap_id": payload.tap_id,
                "device_id": payload.device_id,
                "started_at": server_now,
                "ended_at": None,
                "liters": liters_delta,
                "last_flow_at": server_now,
                "is_long_tail": False,
                "created_at": server_now,
                "updated_at": server_now,
            }
            await db.sessions.insert_one(open_session)
        else:
            session_id = open_session["id"]
            await db.sessions.update_one(
                {"id": session_id},
                {
                    "$inc": {"liters": liters_delta},
                    "$set": {"last_flow_at": server_now, "updated_at": server_now},
                },
            )
            open_session["liters"] = float(open_session.get("liters", 0)) + liters_delta
            open_session["last_flow_at"] = server_now

    if payload.session_end and open_session:
        session_id, session_closed, daily_date = await _close_session(open_session, server_now)
    elif open_session and not payload.session_end:
        session_id = open_session["id"]

    return TelemetryResult(
        accepted=True,
        reading_id=reading_id,
        session_id=session_id,
        session_closed=session_closed,
        daily_date=daily_date,
    )


async def _close_session(session: dict[str, Any], ended_at: datetime) -> tuple[str, bool, str]:
    settings = get_settings()
    db = get_db()
    session_id = session["id"]
    started = session["started_at"]
    if started.tzinfo is None:
        started = started.replace(tzinfo=timezone.utc)
    if ended_at.tzinfo is None:
        ended_at = ended_at.replace(tzinfo=timezone.utc)

    liters = float(session.get("liters", 0))
    duration = max(0.0, (ended_at - started).total_seconds())
    is_long_tail = liters >= settings.long_tail_liters or duration >= settings.long_tail_seconds
    day = _campus_date(ended_at)

    await db.sessions.update_one(
        {"id": session_id},
        {
            "$set": {
                "ended_at": ended_at,
                "duration_seconds": duration,
                "is_long_tail": is_long_tail,
                "updated_at": _now(),
            }
        },
    )
    await db.daily_aggregates.update_one(
        {"tap_id": session["tap_id"], "date": day},
        {
            "$inc": {"liters": liters, "session_count": 1},
            "$set": {"updated_at": _now()},
            "$setOnInsert": {
                "tap_id": session["tap_id"],
                "date": day,
                "created_at": _now(),
            },
        },
        upsert=True,
    )
    logger.info(
        "session closed tap=%s id=%s liters=%.3f duration=%.1fs long_tail=%s day=%s",
        session["tap_id"],
        session_id,
        liters,
        duration,
        is_long_tail,
        day,
    )
    return session_id, True, day


async def close_idle_sessions() -> int:
    """Close sessions with no flow for session_idle_seconds."""
    settings = get_settings()
    db = get_db()
    cutoff = _now() - timedelta(seconds=settings.session_idle_seconds)
    closed = 0
    cursor = db.sessions.find({"ended_at": None, "last_flow_at": {"$lte": cutoff}})
    async for session in cursor:
        await _close_session(session, _now())
        closed += 1
    return closed
