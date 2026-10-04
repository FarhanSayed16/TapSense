"""Phase 20 — facilities alerts: stale devices, leak-like open sessions, ack/resolve."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from app.core.config import get_settings
from app.db.mongo import get_db
from app.services.analytics import record_stale_devices
from app.services.deployment import infer_scope, showcase_enabled


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _serialize(doc: dict[str, Any]) -> dict[str, Any]:
    out = {**doc}
    for key in ("created_at", "updated_at", "acked_at", "resolved_at", "last_seen_at", "started_at"):
        val = out.get(key)
        if isinstance(val, datetime):
            out[key] = val.isoformat()
    return out


async def record_leak_suspects() -> list[dict[str, Any]]:
    """Flag long-running / high-volume open sessions as leak_suspect (basic rule)."""
    settings = get_settings()
    db = get_db()
    now = _now()
    liter_thresh = float(settings.long_tail_liters) * 2.0
    sec_thresh = float(settings.long_tail_seconds) * 3.0
    alerts: list[dict[str, Any]] = []

    open_ids: set[str] = set()
    async for session in db.sessions.find({"ended_at": None}, {"_id": 0}):
        liters = float(session.get("liters", 0))
        started = session.get("started_at")
        if isinstance(started, datetime):
            if started.tzinfo is None:
                started = started.replace(tzinfo=timezone.utc)
            age = (now - started).total_seconds()
        else:
            age = 0.0
        if liters < liter_thresh and age < sec_thresh:
            continue

        sid = session.get("id")
        tap_id = session.get("tap_id")
        alert_id = f"leak-{sid}"
        open_ids.add(alert_id)
        doc = {
            "id": alert_id,
            "type": "leak_suspect",
            "device_id": session.get("device_id"),
            "tap_id": tap_id,
            "session_id": sid,
            "status": "open_session",
            "liters": liters,
            "age_seconds": age,
            "started_at": started,
            "open": True,
            "severity": "warn",
            "message": f"Possible continuous flow on {tap_id}: {liters:.2f} L over {int(age)}s",
            "updated_at": now,
        }
        existing = await db.alerts.find_one({"id": alert_id}, {"_id": 0})
        if existing and existing.get("acked"):
            doc["acked"] = True
            doc["acked_at"] = existing.get("acked_at")
            doc["acked_by"] = existing.get("acked_by")
        await db.alerts.update_one(
            {"id": alert_id},
            {"$set": doc, "$setOnInsert": {"created_at": now}},
            upsert=True,
        )
        alerts.append(doc)

    # Auto-resolve leak alerts whose session closed
    async for stale in db.alerts.find({"type": "leak_suspect", "open": True}, {"_id": 0, "id": 1}):
        if stale["id"] not in open_ids:
            await db.alerts.update_one(
                {"id": stale["id"]},
                {"$set": {"open": False, "resolved_at": now, "updated_at": now, "auto_resolved": True}},
            )
    return alerts


async def sweep_alerts() -> dict[str, Any]:
    stale = await record_stale_devices()
    leaks = await record_leak_suspects()
    open_alerts = await list_alerts(open_only=True)
    return {
        "stale_count": len(stale),
        "leak_count": len(leaks),
        "open_count": len(open_alerts),
        "alerts": open_alerts,
    }


async def list_alerts(
    *,
    open_only: bool = False,
    building_ids: list[str] | None = None,
) -> list[dict[str, Any]]:
    db = get_db()
    query: dict[str, Any] = {}
    if open_only:
        query["open"] = True

    # Optional building scope via device/tap membership
    allowed_device_ids: set[str] | None = None
    if building_ids is not None:
        allowed_device_ids = set()
        async for d in db.devices.find(
            {"$or": [{"building_id": {"$in": building_ids}}, {"tap_ids": {"$exists": True}}]},
            {"_id": 0, "id": 1, "building_id": 1, "tap_ids": 1},
        ):
            if d.get("building_id") in building_ids:
                allowed_device_ids.add(d["id"])
            else:
                # include if any bound tap is in building
                taps = [
                    t
                    async for t in db.taps.find(
                        {"id": {"$in": d.get("tap_ids") or []}, "building_id": {"$in": building_ids}},
                        {"_id": 0, "id": 1},
                    )
                ]
                if taps:
                    allowed_device_ids.add(d["id"])

    show_showcase = await showcase_enabled()
    rows = []
    async for doc in db.alerts.find(query, {"_id": 0}).sort("updated_at", -1):
        if allowed_device_ids is not None and doc.get("device_id") not in allowed_device_ids:
            # leak alerts may key by tap
            tap_id = doc.get("tap_id")
            if tap_id:
                tap = await db.taps.find_one({"id": tap_id}, {"_id": 0, "building_id": 1, "deployment_scope": 1})
                if not tap or tap.get("building_id") not in building_ids:
                    continue
            else:
                continue

        # Hide showcase-device alerts unless professor demo mode is on
        if not show_showcase:
            device_id = doc.get("device_id")
            if device_id:
                device = await db.devices.find_one(
                    {"id": device_id},
                    {"_id": 0, "id": 1, "deployment_scope": 1, "building_id": 1},
                )
                if device and infer_scope(device, kind="device") == "showcase":
                    continue
            tap_id = doc.get("tap_id")
            if tap_id:
                tap = await db.taps.find_one(
                    {"id": tap_id},
                    {"_id": 0, "id": 1, "deployment_scope": 1, "building_id": 1},
                )
                if tap and infer_scope(tap, kind="tap") == "showcase":
                    continue

        rows.append(_serialize(doc))
    return rows


async def ack_alert(alert_id: str, *, by: str | None = None) -> dict[str, Any]:
    db = get_db()
    doc = await db.alerts.find_one({"id": alert_id}, {"_id": 0})
    if not doc:
        raise ValueError("alert not found")
    now = _now()
    await db.alerts.update_one(
        {"id": alert_id},
        {"$set": {"acked": True, "acked_at": now, "acked_by": by, "updated_at": now}},
    )
    out = await db.alerts.find_one({"id": alert_id}, {"_id": 0})
    assert out is not None
    return _serialize(out)


async def resolve_alert(alert_id: str, *, by: str | None = None, note: str | None = None) -> dict[str, Any]:
    db = get_db()
    doc = await db.alerts.find_one({"id": alert_id}, {"_id": 0})
    if not doc:
        raise ValueError("alert not found")
    now = _now()
    await db.alerts.update_one(
        {"id": alert_id},
        {
            "$set": {
                "open": False,
                "resolved_at": now,
                "resolved_by": by,
                "resolve_note": note or "",
                "updated_at": now,
            }
        },
    )
    out = await db.alerts.find_one({"id": alert_id}, {"_id": 0})
    assert out is not None
    return _serialize(out)
