"""Phase 16 — loss-aversion thresholds (wordless green→amber→red bands)."""

from __future__ import annotations

from datetime import date, datetime, timedelta, timezone
from statistics import median
from typing import Any, Literal
from zoneinfo import ZoneInfo

from app.core.config import get_settings
from app.db.mongo import get_db
from app.services.product_phase import SETTINGS_ID, get_product_phase, get_product_phase_doc

BandName = Literal["green", "amber", "red", "idle", "control"]

# Defaults: green < 1.0× threshold, amber < 1.5×, else red. No guilt copy stored.
DEFAULT_BANDS = {
    "green_max_ratio": 1.0,
    "amber_max_ratio": 1.5,
}

DEFAULT_SESSION_LITERS = {
    "tap_b": 1.5,
    "tap_c": 1.5,
}


def _tz() -> ZoneInfo:
    return ZoneInfo(get_settings().campus_timezone)


def _parse_day(value: str) -> date:
    return date.fromisoformat(value)


def band_for_liters(
    liters: float,
    threshold: float,
    green_max_ratio: float,
    amber_max_ratio: float,
) -> BandName:
    if threshold <= 0:
        return "green"
    ratio = liters / threshold
    if ratio < green_max_ratio:
        return "green"
    if ratio < amber_max_ratio:
        return "amber"
    return "red"


async def get_thresholds() -> dict[str, Any]:
    doc = await get_product_phase_doc()
    raw = doc.get("thresholds") or {}
    bands = {
        "green_max_ratio": float(
            (raw.get("bands") or {}).get("green_max_ratio", DEFAULT_BANDS["green_max_ratio"])
        ),
        "amber_max_ratio": float(
            (raw.get("bands") or {}).get("amber_max_ratio", DEFAULT_BANDS["amber_max_ratio"])
        ),
    }
    if bands["amber_max_ratio"] <= bands["green_max_ratio"]:
        bands["amber_max_ratio"] = bands["green_max_ratio"] + 0.25

    taps_out: dict[str, Any] = {}
    async for tap in get_db().taps.find({}, {"_id": 0, "id": 1, "name": 1, "is_control": 1}):
        tid = tap["id"]
        stored = (raw.get("taps") or {}).get(tid) or {}
        default_th = DEFAULT_SESSION_LITERS.get(tid, 1.5)
        taps_out[tid] = {
            "tap_id": tid,
            "name": tap.get("name", tid),
            "is_control": bool(tap.get("is_control")),
            "enabled": False if tap.get("is_control") else bool(stored.get("enabled", True)),
            "session_liters_threshold": float(
                stored.get("session_liters_threshold", default_th if not tap.get("is_control") else 0)
            ),
            "source": stored.get("source") or ("default" if not tap.get("is_control") else "control"),
            "notes": stored.get("notes") or "",
        }

    return {
        "bands": bands,
        "taps": taps_out,
        "rule": "Control tap never receives color cues. Bands are ratios of session liters to threshold.",
        "honesty": "No guilt strings in config — green/amber/red only.",
        "updated_at": (raw.get("updated_at") or doc.get("updated_at")),
        "timezone": get_settings().campus_timezone,
    }


async def update_thresholds(
    *,
    bands: dict[str, float] | None = None,
    taps: dict[str, Any] | None = None,
    updated_by: str | None = None,
) -> dict[str, Any]:
    current = await get_thresholds()
    next_bands = dict(current["bands"])
    if bands:
        if "green_max_ratio" in bands:
            next_bands["green_max_ratio"] = float(bands["green_max_ratio"])
        if "amber_max_ratio" in bands:
            next_bands["amber_max_ratio"] = float(bands["amber_max_ratio"])
        if next_bands["green_max_ratio"] <= 0:
            raise ValueError("green_max_ratio must be > 0")
        if next_bands["amber_max_ratio"] <= next_bands["green_max_ratio"]:
            raise ValueError("amber_max_ratio must be > green_max_ratio")

    next_taps: dict[str, Any] = {}
    for tid, row in current["taps"].items():
        next_taps[tid] = {
            "enabled": row["enabled"],
            "session_liters_threshold": row["session_liters_threshold"],
            "source": row["source"],
            "notes": row["notes"],
        }

    if taps:
        for tid, patch in taps.items():
            if tid not in next_taps:
                raise ValueError(f"unknown tap_id: {tid}")
            if current["taps"][tid]["is_control"]:
                # Control stays uncued — ignore enable / keep threshold at 0
                next_taps[tid] = {
                    "enabled": False,
                    "session_liters_threshold": 0.0,
                    "source": "control",
                    "notes": patch.get("notes") or next_taps[tid].get("notes") or "",
                }
                continue
            if "enabled" in patch:
                next_taps[tid]["enabled"] = bool(patch["enabled"])
            if "session_liters_threshold" in patch:
                th = float(patch["session_liters_threshold"])
                if th <= 0:
                    raise ValueError(f"{tid}: session_liters_threshold must be > 0")
                next_taps[tid]["session_liters_threshold"] = th
            if "source" in patch and patch["source"]:
                next_taps[tid]["source"] = str(patch["source"])
            if "notes" in patch and patch["notes"] is not None:
                next_taps[tid]["notes"] = str(patch["notes"])

    now = datetime.now(timezone.utc)
    payload = {
        "bands": next_bands,
        "taps": next_taps,
        "updated_at": now,
        "updated_by": updated_by,
    }
    await get_db().pilot_settings.update_one(
        {"id": SETTINGS_ID},
        {
            "$set": {"thresholds": payload, "updated_at": now, "updated_by": updated_by},
            "$setOnInsert": {"id": SETTINGS_ID, "product_phase": 0, "created_at": now},
        },
        upsert=True,
    )
    return await get_thresholds()


async def suggest_thresholds_from_window(start: str, end: str) -> dict[str, Any]:
    """Median closed-session liters per intervention tap → suggested thresholds."""
    start_d = _parse_day(start)
    end_d = _parse_day(end)
    if end_d < start_d:
        raise ValueError("end must be >= start")
    tz = _tz()
    start_dt = datetime.combine(start_d, datetime.min.time(), tzinfo=tz).astimezone(timezone.utc)
    end_dt = datetime.combine(end_d + timedelta(days=1), datetime.min.time(), tzinfo=tz).astimezone(
        timezone.utc
    )
    db = get_db()
    taps = {
        doc["id"]: doc
        async for doc in db.taps.find({}, {"_id": 0, "id": 1, "name": 1, "is_control": 1})
    }
    liters_by_tap: dict[str, list[float]] = {tid: [] for tid in taps}
    async for s in db.sessions.find(
        {"ended_at": {"$gte": start_dt, "$lt": end_dt}},
        {"_id": 0, "tap_id": 1, "liters": 1},
    ):
        tid = s.get("tap_id")
        if tid in liters_by_tap:
            liters_by_tap[tid].append(float(s.get("liters", 0)))

    suggestions: dict[str, Any] = {}
    for tid, values in liters_by_tap.items():
        tap = taps[tid]
        if tap.get("is_control"):
            suggestions[tid] = {
                "tap_id": tid,
                "name": tap.get("name"),
                "is_control": True,
                "session_count": len(values),
                "median_session_liters": None,
                "suggested_threshold": None,
                "note": "Control — never cued",
            }
            continue
        med = float(median(values)) if values else float(DEFAULT_SESSION_LITERS.get(tid, 1.5))
        suggestions[tid] = {
            "tap_id": tid,
            "name": tap.get("name"),
            "is_control": False,
            "session_count": len(values),
            "median_session_liters": round(med, 3) if values else None,
            "suggested_threshold": round(med, 3),
            "note": "median closed sessions" if values else "default (no sessions in window)",
        }

    return {
        "start": start,
        "end": end,
        "timezone": get_settings().campus_timezone,
        "suggestions": suggestions,
        "honesty": "Suggestion only — apply explicitly. Pilot N may be small.",
    }


async def apply_suggestions(
    start: str,
    end: str,
    *,
    updated_by: str | None = None,
) -> dict[str, Any]:
    sug = await suggest_thresholds_from_window(start, end)
    patch: dict[str, Any] = {}
    for tid, row in sug["suggestions"].items():
        if row.get("is_control") or row.get("suggested_threshold") is None:
            continue
        patch[tid] = {
            "enabled": True,
            "session_liters_threshold": row["suggested_threshold"],
            "source": f"median:{start}:{end}",
            "notes": row.get("note") or "",
        }
    return await update_thresholds(taps=patch, updated_by=updated_by)


async def live_color_state() -> dict[str, Any]:
    """Intervention channels with current band for open session liters."""
    phase = await get_product_phase()
    thresholds = await get_thresholds()
    bands = thresholds["bands"]
    db = get_db()

    taps = {
        doc["id"]: doc
        async for doc in db.taps.find({"is_control": False}, {"_id": 0, "id": 1, "name": 1})
    }
    open_by_tap: dict[str, dict] = {}
    async for session in db.sessions.find(
        {"ended_at": None, "tap_id": {"$in": list(taps.keys())}},
        {"_id": 0},
    ):
        open_by_tap[session["tap_id"]] = session

    channels = []
    for tap_id in sorted(taps.keys()):
        cfg = thresholds["taps"].get(tap_id, {})
        sess = open_by_tap.get(tap_id)
        liters = float(sess.get("liters", 0)) if sess else 0.0
        th = float(cfg.get("session_liters_threshold") or 0)
        enabled = bool(cfg.get("enabled", True)) and phase.product_phase >= 2
        if not sess:
            band: BandName = "idle"
        elif not enabled or th <= 0:
            band = "green"
        else:
            band = band_for_liters(
                liters,
                th,
                bands["green_max_ratio"],
                bands["amber_max_ratio"],
            )
        channels.append(
            {
                "tap_id": tap_id,
                "name": taps[tap_id].get("name", tap_id),
                "session_open": sess is not None,
                "session_liters": liters,
                "last_flow_at": sess.get("last_flow_at") if sess else None,
                "threshold_liters": th,
                "enabled": enabled,
                "band": band,
            }
        )

    return {
        "product_phase": phase.product_phase,
        "color_enabled": phase.product_phase >= 2,
        "visibility_enabled": phase.visibility_enabled,
        "label": phase.label,
        "bands": bands,
        "channels": channels,
        "rule": "Control tap_a never appears here",
    }
