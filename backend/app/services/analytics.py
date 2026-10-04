"""Phase 14 — pilot analytics: windows, compare, control split, exports, stale alerts."""

from __future__ import annotations

import csv
import io
from datetime import date, datetime, timedelta, timezone
from typing import Any, Literal
from zoneinfo import ZoneInfo

from app.core.config import get_settings
from app.db.mongo import get_db
from app.services.baseline import build_baseline_report
from app.services.deployment import filter_docs_by_scope
from app.services.product_phase import SETTINGS_ID, get_product_phase_doc, phase_label


def _tz() -> ZoneInfo:
    return ZoneInfo(get_settings().campus_timezone)


def _parse_day(value: str) -> date:
    return date.fromisoformat(value)


def _pct_delta(before: float, after: float) -> float | None:
    if before == 0:
        return None if after == 0 else 100.0
    return round(100.0 * (after - before) / before, 2)


async def get_phase_windows() -> dict[str, Any]:
    doc = await get_product_phase_doc()
    windows = doc.get("phase_windows") or {}
    # Normalize keys as strings "0".."3"
    out = {}
    for p in (0, 1, 2, 3):
        key = str(p)
        w = windows.get(key) or windows.get(p) or {}
        out[key] = {
            "phase": p,
            "label": phase_label(p),
            "start": w.get("start"),
            "end": w.get("end"),
            "notes": w.get("notes") or "",
        }
    return {
        "timezone": get_settings().campus_timezone,
        "windows": out,
        "updated_at": doc.get("updated_at"),
    }


async def set_phase_window(
    phase: int,
    start: str | None,
    end: str | None,
    notes: str | None = None,
    updated_by: str | None = None,
) -> dict[str, Any]:
    if phase not in (0, 1, 2, 3):
        raise ValueError("phase must be 0–3")
    if start:
        _parse_day(start)
    if end:
        _parse_day(end)
    if start and end and _parse_day(end) < _parse_day(start):
        raise ValueError("end must be >= start")

    now = datetime.now(timezone.utc)
    db = get_db()
    await db.pilot_settings.update_one(
        {"id": SETTINGS_ID},
        {
            "$set": {
                f"phase_windows.{phase}.start": start,
                f"phase_windows.{phase}.end": end,
                f"phase_windows.{phase}.notes": notes or "",
                "updated_at": now,
                "updated_by": updated_by,
            },
            "$setOnInsert": {"id": SETTINGS_ID, "product_phase": 0, "created_at": now},
        },
        upsert=True,
    )
    return await get_phase_windows()


async def resolve_window(
    phase: int | None = None,
    start: str | None = None,
    end: str | None = None,
) -> tuple[str, str]:
    if start and end:
        return start, end
    if phase is None:
        raise ValueError("Provide phase or start+end")
    windows = await get_phase_windows()
    w = windows["windows"].get(str(phase), {})
    if not w.get("start") or not w.get("end"):
        raise ValueError(
            f"Phase {phase} has no date window. Set it via PATCH /api/v1/phase-windows"
        )
    return w["start"], w["end"]


async def window_metrics(start: str, end: str) -> dict[str, Any]:
    """Reuse baseline report engine for any campus date window."""
    return await build_baseline_report(start, end)


async def compare_phases(
    phase_a: int = 0,
    phase_b: int = 1,
    start_a: str | None = None,
    end_a: str | None = None,
    start_b: str | None = None,
    end_b: str | None = None,
) -> dict[str, Any]:
    a_start, a_end = await resolve_window(phase_a, start_a, end_a)
    b_start, b_end = await resolve_window(phase_b, start_b, end_b)
    report_a = await window_metrics(a_start, a_end)
    report_b = await window_metrics(b_start, b_end)

    per_tap_delta: dict[str, Any] = {}
    for tid, row_a in report_a["per_tap"].items():
        row_b = report_b["per_tap"].get(tid, {})
        per_tap_delta[tid] = {
            "name": row_a.get("name"),
            "is_control": row_a.get("is_control"),
            "mean_liters_per_day": {
                "a": row_a.get("mean_liters_per_day"),
                "b": row_b.get("mean_liters_per_day"),
                "delta_pct": _pct_delta(
                    float(row_a.get("mean_liters_per_day") or 0),
                    float(row_b.get("mean_liters_per_day") or 0),
                ),
            },
            "mean_session_liters": {
                "a": row_a.get("mean_session_liters"),
                "b": row_b.get("mean_session_liters"),
                "delta_pct": _pct_delta(
                    float(row_a.get("mean_session_liters") or 0),
                    float(row_b.get("mean_session_liters") or 0),
                ),
            },
            "long_tail_session_pct": {
                "a": row_a.get("long_tail_session_pct"),
                "b": row_b.get("long_tail_session_pct"),
                "delta_pp": round(
                    float(row_b.get("long_tail_session_pct") or 0)
                    - float(row_a.get("long_tail_session_pct") or 0),
                    2,
                ),
            },
            "session_count": {
                "a": row_a.get("session_count"),
                "b": row_b.get("session_count"),
            },
        }

    def _cohort(report: dict[str, Any], control: bool) -> dict[str, float]:
        rows = [r for r in report["per_tap"].values() if bool(r["is_control"]) is control]
        if not rows:
            return {
                "mean_liters_per_day": 0.0,
                "mean_session_liters": 0.0,
                "long_tail_session_pct": 0.0,
                "n_taps": 0,
            }
        n = len(rows)
        return {
            "mean_liters_per_day": round(sum(r["mean_liters_per_day"] for r in rows) / n, 3),
            "mean_session_liters": round(sum(r["mean_session_liters"] for r in rows) / n, 3),
            "long_tail_session_pct": round(sum(r["long_tail_session_pct"] for r in rows) / n, 2),
            "n_taps": n,
        }

    return {
        "phase_a": {
            "phase": phase_a,
            "label": phase_label(phase_a),
            "start": a_start,
            "end": a_end,
            "overall": report_a["overall"],
            "control": _cohort(report_a, True),
            "intervention": _cohort(report_a, False),
        },
        "phase_b": {
            "phase": phase_b,
            "label": phase_label(phase_b),
            "start": b_start,
            "end": b_end,
            "overall": report_b["overall"],
            "control": _cohort(report_b, True),
            "intervention": _cohort(report_b, False),
        },
        "per_tap_delta": per_tap_delta,
        "honesty": "Pilot N is small — treat deltas as descriptive, not powered causal proof.",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "timezone": get_settings().campus_timezone,
    }


async def control_vs_intervention(start: str, end: str) -> dict[str, Any]:
    report = await window_metrics(start, end)

    def _cohort(control: bool) -> dict[str, float]:
        rows = [r for r in report["per_tap"].values() if bool(r["is_control"]) is control]
        if not rows:
            return {
                "mean_liters_per_day": 0.0,
                "mean_session_liters": 0.0,
                "long_tail_session_pct": 0.0,
                "n_taps": 0,
            }
        n = len(rows)
        return {
            "mean_liters_per_day": round(sum(r["mean_liters_per_day"] for r in rows) / n, 3),
            "mean_session_liters": round(sum(r["mean_session_liters"] for r in rows) / n, 3),
            "long_tail_session_pct": round(sum(r["long_tail_session_pct"] for r in rows) / n, 2),
            "n_taps": n,
        }

    return {
        "start": start,
        "end": end,
        "timezone": report["timezone"],
        "generated_at": report["generated_at"],
        "split": {
            "control": _cohort(True),
            "intervention": _cohort(False),
        },
        "baseline_split": report["control_vs_intervention"],
        "per_tap": report["per_tap"],
        "overall": report["overall"],
        "honesty": "Descriptive pilot split — not a powered RCT.",
    }


async def export_sessions_rows(start: str, end: str) -> list[dict[str, Any]]:
    start_d = _parse_day(start)
    end_d = _parse_day(end)
    tz = _tz()
    start_dt = datetime.combine(start_d, datetime.min.time(), tzinfo=tz).astimezone(timezone.utc)
    end_dt = datetime.combine(end_d + timedelta(days=1), datetime.min.time(), tzinfo=tz).astimezone(
        timezone.utc
    )
    tap_docs = [doc async for doc in get_db().taps.find({}, {"_id": 0, "id": 1, "name": 1, "is_control": 1, "deployment_scope": 1, "building_id": 1})]
    tap_docs = await filter_docs_by_scope(tap_docs, kind="tap")
    taps = {doc["id"]: doc for doc in tap_docs}
    rows = []
    async for s in get_db().sessions.find(
        {"started_at": {"$gte": start_dt, "$lt": end_dt}},
        {"_id": 0},
    ).sort("started_at", 1):
        tid = s.get("tap_id")
        if tid not in taps:
            continue
        tap = taps.get(tid, {})
        rows.append(
            {
                "session_id": s.get("id"),
                "tap_id": tid,
                "tap_name": tap.get("name"),
                "is_control": bool(tap.get("is_control")),
                "device_id": s.get("device_id"),
                "started_at": s.get("started_at").isoformat() if s.get("started_at") else None,
                "ended_at": s.get("ended_at").isoformat() if s.get("ended_at") else None,
                "liters": float(s.get("liters", 0)),
                "duration_seconds": s.get("duration_seconds"),
                "is_long_tail": bool(s.get("is_long_tail", False)),
            }
        )
    return rows


async def export_daily_rows(start: str, end: str) -> list[dict[str, Any]]:
    tap_docs = [doc async for doc in get_db().taps.find({}, {"_id": 0, "id": 1, "name": 1, "is_control": 1, "deployment_scope": 1, "building_id": 1})]
    tap_docs = await filter_docs_by_scope(tap_docs, kind="tap")
    taps = {doc["id"]: doc for doc in tap_docs}
    rows = []
    async for d in get_db().daily_aggregates.find(
        {"date": {"$gte": start, "$lte": end}},
        {"_id": 0},
    ).sort([("date", 1), ("tap_id", 1)]):
        tid = d.get("tap_id")
        if tid not in taps:
            continue
        tap = taps.get(tid, {})
        rows.append(
            {
                "date": d.get("date"),
                "tap_id": tid,
                "tap_name": tap.get("name"),
                "is_control": bool(tap.get("is_control")),
                "liters": float(d.get("liters", 0)),
                "session_count": int(d.get("session_count", 0)),
            }
        )
    return rows


def rows_to_csv(rows: list[dict[str, Any]]) -> str:
    if not rows:
        return ""
    buf = io.StringIO()
    writer = csv.DictWriter(buf, fieldnames=list(rows[0].keys()))
    writer.writeheader()
    writer.writerows(rows)
    return buf.getvalue()


async def record_stale_devices() -> list[dict[str, Any]]:
    """Write/update stale-device alert records; return current open alerts."""
    settings = get_settings()
    db = get_db()
    now = datetime.now(timezone.utc)
    stale_after = settings.device_stale_seconds
    alerts: list[dict[str, Any]] = []

    async for device in db.devices.find({}, {"_id": 0}):
        last = device.get("last_seen_at")
        device_id = device["id"]
        if last is None:
            status = "unknown"
            age = None
        else:
            if last.tzinfo is None:
                last = last.replace(tzinfo=timezone.utc)
            age = (now - last).total_seconds()
            status = "online" if age <= stale_after else "stale"

        if status in ("stale", "unknown"):
            alert_id = f"stale-{device_id}"
            doc = {
                "id": alert_id,
                "type": "device_stale",
                "device_id": device_id,
                "status": status,
                "last_seen_at": last,
                "age_seconds": age,
                "open": True,
                "severity": "warn",
                "message": f"Device {device_id} is {status}",
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
        else:
            await db.alerts.update_one(
                {"id": f"stale-{device_id}", "open": True},
                {"$set": {"open": False, "resolved_at": now, "updated_at": now}},
            )
    return alerts


async def list_open_alerts() -> list[dict[str, Any]]:
    return [
        doc
        async for doc in get_db().alerts.find({"open": True}, {"_id": 0}).sort("updated_at", -1)
    ]


async def reconcile_daily_from_sessions(day: str | None = None) -> dict[str, Any]:
    """Rebuild daily_aggregates for a campus day from closed sessions (repair tool)."""
    tz = _tz()
    if day:
        target = _parse_day(day)
    else:
        target = datetime.now(tz).date() - timedelta(days=1)

    start_dt = datetime.combine(target, datetime.min.time(), tzinfo=tz).astimezone(timezone.utc)
    end_dt = start_dt + timedelta(days=1)
    day_str = target.isoformat()
    db = get_db()

    totals: dict[str, dict[str, float]] = {}
    async for s in db.sessions.find(
        {
            "ended_at": {"$gte": start_dt, "$lt": end_dt},
        },
        {"_id": 0, "tap_id": 1, "liters": 1},
    ):
        tid = s.get("tap_id")
        if not tid:
            continue
        bucket = totals.setdefault(tid, {"liters": 0.0, "session_count": 0})
        bucket["liters"] += float(s.get("liters", 0))
        bucket["session_count"] += 1

    now = datetime.now(timezone.utc)
    await db.daily_aggregates.delete_many({"date": day_str})
    for tid, vals in totals.items():
        await db.daily_aggregates.insert_one(
            {
                "tap_id": tid,
                "date": day_str,
                "liters": vals["liters"],
                "session_count": int(vals["session_count"]),
                "created_at": now,
                "updated_at": now,
                "reconciled": True,
            }
        )
    return {"date": day_str, "taps": len(totals), "totals": totals}
