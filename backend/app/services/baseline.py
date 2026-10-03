from __future__ import annotations

from collections import Counter, defaultdict
from datetime import date, datetime, timedelta, timezone
from typing import Any
from zoneinfo import ZoneInfo

from app.core.config import get_settings
from app.db.mongo import get_db


def _parse_day(value: str) -> date:
    return date.fromisoformat(value)


def _campus_tz() -> ZoneInfo:
    return ZoneInfo(get_settings().campus_timezone)


def _as_utc(dt: datetime) -> datetime:
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


async def build_baseline_report(start: str, end: str) -> dict[str, Any]:
    """Compute Phase 11 baseline metrics for [start, end] inclusive (campus dates)."""
    start_d = _parse_day(start)
    end_d = _parse_day(end)
    if end_d < start_d:
        raise ValueError("end must be >= start")

    days = (end_d - start_d).days + 1
    db = get_db()
    tz = _campus_tz()

    taps = [doc async for doc in db.taps.find({}, {"_id": 0}).sort("id", 1)]
    tap_ids = [t["id"] for t in taps]

    daily_rows = [
        doc
        async for doc in db.daily_aggregates.find(
            {"date": {"$gte": start, "$lte": end}},
            {"_id": 0},
        )
    ]

    # sessions overlapping the window by started_at campus date
    start_dt = datetime.combine(start_d, datetime.min.time(), tzinfo=tz).astimezone(timezone.utc)
    end_dt = datetime.combine(end_d + timedelta(days=1), datetime.min.time(), tzinfo=tz).astimezone(
        timezone.utc
    )
    sessions = [
        doc
        async for doc in db.sessions.find(
            {"started_at": {"$gte": start_dt, "$lt": end_dt}},
            {"_id": 0},
        )
    ]

    liters_by_tap_day: dict[str, dict[str, float]] = defaultdict(dict)
    for row in daily_rows:
        liters_by_tap_day[row["tap_id"]][row["date"]] = float(row.get("liters", 0))

    per_tap: dict[str, Any] = {}
    hour_counter: Counter[int] = Counter()

    for tap in taps:
        tid = tap["id"]
        day_map = liters_by_tap_day.get(tid, {})
        day_values = [day_map.get((start_d + timedelta(days=i)).isoformat(), 0.0) for i in range(days)]
        mean_l_day = sum(day_values) / days if days else 0.0

        tap_sessions = [s for s in sessions if s.get("tap_id") == tid and s.get("ended_at")]
        liters_list = [float(s.get("liters", 0)) for s in tap_sessions]
        mean_session = sum(liters_list) / len(liters_list) if liters_list else 0.0
        long_tail_sessions = [s for s in tap_sessions if s.get("is_long_tail")]
        lt_session_pct = (100.0 * len(long_tail_sessions) / len(tap_sessions)) if tap_sessions else 0.0
        total_vol = sum(liters_list)
        lt_vol = sum(float(s.get("liters", 0)) for s in long_tail_sessions)
        lt_vol_pct = (100.0 * lt_vol / total_vol) if total_vol > 0 else 0.0

        for s in tap_sessions:
            started = _as_utc(s["started_at"]).astimezone(tz)
            hour_counter[started.hour] += 1

        per_tap[tid] = {
            "name": tap.get("name"),
            "is_control": bool(tap.get("is_control")),
            "days": days,
            "liters_per_day": day_values,
            "mean_liters_per_day": round(mean_l_day, 3),
            "session_count": len(tap_sessions),
            "mean_session_liters": round(mean_session, 3),
            "long_tail_session_pct": round(lt_session_pct, 2),
            "long_tail_volume_pct": round(lt_vol_pct, 2),
            "total_session_liters": round(total_vol, 3),
        }

    peak_hours = [h for h, _ in hour_counter.most_common(3)]

    control = [per_tap[t] for t in tap_ids if per_tap[t]["is_control"]]
    intervention = [per_tap[t] for t in tap_ids if not per_tap[t]["is_control"]]

    def _mean(key: str, rows: list[dict[str, Any]]) -> float:
        if not rows:
            return 0.0
        return round(sum(float(r[key]) for r in rows) / len(rows), 3)

    overall_lt_sessions = sum(1 for s in sessions if s.get("ended_at") and s.get("is_long_tail"))
    overall_sessions = sum(1 for s in sessions if s.get("ended_at"))
    overall_lt_vol = sum(float(s.get("liters", 0)) for s in sessions if s.get("ended_at") and s.get("is_long_tail"))
    overall_vol = sum(float(s.get("liters", 0)) for s in sessions if s.get("ended_at"))

    suggested_go = (
        (overall_vol > 0 and (100.0 * overall_lt_vol / overall_vol) >= 15.0)
        or (overall_sessions > 0 and (100.0 * overall_lt_sessions / overall_sessions) >= 15.0)
    )

    return {
        "phase": "phase_0_baseline",
        "start": start,
        "end": end,
        "days": days,
        "timezone": get_settings().campus_timezone,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "per_tap": per_tap,
        "peak_hours_local": peak_hours,
        "hour_histogram": dict(sorted(hour_counter.items())),
        "control_vs_intervention": {
            "control_mean_l_day": _mean("mean_liters_per_day", control),
            "intervention_mean_l_day": _mean("mean_liters_per_day", intervention),
            "control_mean_session_l": _mean("mean_session_liters", control),
            "intervention_mean_session_l": _mean("mean_session_liters", intervention),
            "note": "Descriptive only — N is a pilot, not a powered study.",
        },
        "overall": {
            "closed_sessions": overall_sessions,
            "long_tail_session_pct": round(
                (100.0 * overall_lt_sessions / overall_sessions) if overall_sessions else 0.0, 2
            ),
            "long_tail_volume_pct": round(
                (100.0 * overall_lt_vol / overall_vol) if overall_vol else 0.0, 2
            ),
        },
        "suggested_go_for_phase1": suggested_go,
        "suggested_rule": "GO suggested if long-tail volume share or session share >= 15% (override with judgment).",
    }


def report_to_markdown(report: dict[str, Any]) -> str:
    lines = [
        f"# Baseline report ({report['start']} → {report['end']})",
        "",
        f"- Days: **{report['days']}** · TZ: `{report['timezone']}`",
        f"- Generated: `{report['generated_at']}`",
        f"- Overall long-tail session %: **{report['overall']['long_tail_session_pct']}**",
        f"- Overall long-tail volume %: **{report['overall']['long_tail_volume_pct']}**",
        f"- Peak hours (local): **{report['peak_hours_local']}**",
        f"- Suggested GO for Phase 1: **{report['suggested_go_for_phase1']}**",
        "",
        "## Per tap",
        "",
        "| Tap | Control | Mean L/day | Sessions | Mean session L | LT session % | LT volume % |",
        "|---|---|---|---|---|---|---|",
    ]
    for tid, row in report["per_tap"].items():
        lines.append(
            f"| {tid} | {row['is_control']} | {row['mean_liters_per_day']} | {row['session_count']} | "
            f"{row['mean_session_liters']} | {row['long_tail_session_pct']} | {row['long_tail_volume_pct']} |"
        )
    cvi = report["control_vs_intervention"]
    lines.extend(
        [
            "",
            "## Control vs intervention (descriptive)",
            "",
            f"- Control mean L/day: {cvi['control_mean_l_day']}",
            f"- Intervention mean L/day: {cvi['intervention_mean_l_day']}",
            f"- Control mean session L: {cvi['control_mean_session_l']}",
            f"- Intervention mean session L: {cvi['intervention_mean_session_l']}",
            f"- _{cvi['note']}_",
            "",
            "## Next",
            "",
            "Copy numbers into `docs/phase-11-baseline-note-template.md` and record GO / NO-GO.",
            "",
        ]
    )
    return "\n".join(lines)
