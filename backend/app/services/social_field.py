"""Phase 18 — Product Phase 3 social comparison field ops (cadence, placement, attribution)."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from app.core.config import get_settings
from app.db.mongo import get_db
from app.services.analytics import compare_phases, get_phase_windows
from app.services.leaderboard import (
    DEFAULT_BOARD_ID,
    build_snapshot,
    get_or_build_snapshot,
    public_board_view,
    week_bounds,
)
from app.services.product_phase import SETTINGS_ID, get_product_phase, get_product_phase_doc

DEFAULT_SOCIAL = {
    "placement_location": "",
    "placement_notes": "",
    "board_id": DEFAULT_BOARD_ID,
    "cadence_weekday": 0,  # Monday = publish/refresh day (campus week start)
    "cadence_locked": False,
    "locked_at": None,
    "locked_by": None,
    "recognition_label": "Lowest use this week",
    "checklist": {
        "board_placed": False,
        "public_url_tested": False,
        "weekly_refresh_assigned": False,
        "control_still_uncued": False,
        "no_shame_copy_verified": False,
    },
}


async def get_social_field() -> dict[str, Any]:
    doc = await get_product_phase_doc()
    raw = doc.get("social_field") or {}
    checklist = {**DEFAULT_SOCIAL["checklist"], **(raw.get("checklist") or {})}
    phase = await get_product_phase()
    start, end = week_bounds()

    board_id = raw.get("board_id") or DEFAULT_BOARD_ID
    snap = None
    try:
        snap = await get_or_build_snapshot(board_id)
    except Exception:
        snap = None

    locked_at = raw.get("locked_at")
    if isinstance(locked_at, datetime):
        locked_at = locked_at.isoformat()
    updated_at = raw.get("updated_at") or doc.get("updated_at")
    if isinstance(updated_at, datetime):
        updated_at = updated_at.isoformat()

    return {
        "social_enabled": phase.product_phase >= 3,
        "product_phase": phase.product_phase,
        "label": phase.label,
        "placement_location": raw.get("placement_location") or "",
        "placement_notes": raw.get("placement_notes") or "",
        "board_id": board_id,
        "cadence_weekday": int(raw.get("cadence_weekday", DEFAULT_SOCIAL["cadence_weekday"])),
        "cadence_weekday_name": _weekday_name(
            int(raw.get("cadence_weekday", DEFAULT_SOCIAL["cadence_weekday"]))
        ),
        "cadence_locked": bool(raw.get("cadence_locked", False)),
        "locked_at": locked_at,
        "locked_by": raw.get("locked_by"),
        "recognition_label": raw.get("recognition_label")
        or DEFAULT_SOCIAL["recognition_label"],
        "checklist": checklist,
        "current_week": {
            "week_start": start.isoformat(),
            "week_end": end.isoformat(),
            "timezone": get_settings().campus_timezone,
            "winner": (snap or {}).get("winner"),
            "entry_count": (snap or {}).get("entry_count"),
        },
        "public_path": f"/leaderboard/public/{board_id}",
        "rule": "Positive recognition for lowest use only — no shame copy, no person IDs, control never cued.",
        "updated_at": updated_at,
    }


def _weekday_name(n: int) -> str:
    names = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    if 0 <= n <= 6:
        return names[n]
    return "Monday"


async def update_social_field(
    patch: dict[str, Any],
    *,
    updated_by: str | None = None,
) -> dict[str, Any]:
    current = await get_social_field()
    # Do not allow unlocking via generic patch if locked — use unlock endpoint
    next_doc: dict[str, Any] = {
        "placement_location": patch.get("placement_location", current["placement_location"]),
        "placement_notes": patch.get("placement_notes", current["placement_notes"]),
        "board_id": patch.get("board_id", current["board_id"]),
        "cadence_weekday": int(patch.get("cadence_weekday", current["cadence_weekday"])),
        "recognition_label": patch.get("recognition_label", current["recognition_label"]),
        "checklist": {**current["checklist"], **(patch.get("checklist") or {})},
        "cadence_locked": current["cadence_locked"],
        "locked_at": current["locked_at"],
        "locked_by": current["locked_by"],
    }
    if next_doc["cadence_weekday"] < 0 or next_doc["cadence_weekday"] > 6:
        raise ValueError("cadence_weekday must be 0–6 (Mon–Sun)")
    if current["cadence_locked"]:
        # When locked, only checklist / placement notes may change — not weekday/board
        next_doc["cadence_weekday"] = current["cadence_weekday"]
        next_doc["board_id"] = current["board_id"]
        next_doc["recognition_label"] = (
            patch.get("recognition_label", current["recognition_label"])
            if "recognition_label" in patch
            else current["recognition_label"]
        )

    now = datetime.now(timezone.utc)
    next_doc["updated_at"] = now
    next_doc["updated_by"] = updated_by
    await get_db().pilot_settings.update_one(
        {"id": SETTINGS_ID},
        {
            "$set": {"social_field": next_doc, "updated_at": now, "updated_by": updated_by},
            "$setOnInsert": {"id": SETTINGS_ID, "product_phase": 0, "created_at": now},
        },
        upsert=True,
    )
    return await get_social_field()


async def lock_cadence(*, updated_by: str | None = None) -> dict[str, Any]:
    current = await get_social_field()
    now = datetime.now(timezone.utc)
    social = {
        "placement_location": current["placement_location"],
        "placement_notes": current["placement_notes"],
        "board_id": current["board_id"],
        "cadence_weekday": current["cadence_weekday"],
        "recognition_label": current["recognition_label"],
        "checklist": current["checklist"],
        "cadence_locked": True,
        "locked_at": now,
        "locked_by": updated_by,
        "updated_at": now,
        "updated_by": updated_by,
    }
    await get_db().pilot_settings.update_one(
        {"id": SETTINGS_ID},
        {"$set": {"social_field": social, "updated_at": now, "updated_by": updated_by}},
        upsert=True,
    )
    # Refresh board snapshot so field week starts clean
    await build_snapshot(current["board_id"])
    return await get_social_field()


async def unlock_cadence(*, updated_by: str | None = None) -> dict[str, Any]:
    current = await get_social_field()
    now = datetime.now(timezone.utc)
    social = {
        "placement_location": current["placement_location"],
        "placement_notes": current["placement_notes"],
        "board_id": current["board_id"],
        "cadence_weekday": current["cadence_weekday"],
        "recognition_label": current["recognition_label"],
        "checklist": current["checklist"],
        "cadence_locked": False,
        "locked_at": None,
        "locked_by": None,
        "updated_at": now,
        "updated_by": updated_by,
    }
    await get_db().pilot_settings.update_one(
        {"id": SETTINGS_ID},
        {"$set": {"social_field": social, "updated_at": now, "updated_by": updated_by}},
        upsert=True,
    )
    return await get_social_field()


async def attribution_note() -> dict[str, Any]:
    """Three-layer descriptive deltas using tagged phase windows (1→2→3)."""
    windows = await get_phase_windows()
    layers: list[dict[str, Any]] = []
    pairs = [(1, 2, "visibility → color"), (2, 3, "color → social")]
    for a, b, label in pairs:
        wa = windows["windows"].get(str(a), {})
        wb = windows["windows"].get(str(b), {})
        if not (wa.get("start") and wa.get("end") and wb.get("start") and wb.get("end")):
            layers.append(
                {
                    "layer": label,
                    "phase_a": a,
                    "phase_b": b,
                    "ready": False,
                    "detail": "Tag both phase date windows on /phases first.",
                }
            )
            continue
        try:
            cmp = await compare_phases(phase_a=a, phase_b=b)
            layers.append(
                {
                    "layer": label,
                    "phase_a": a,
                    "phase_b": b,
                    "ready": True,
                    "intervention_mean_l_day_a": cmp["phase_a"]["intervention"]["mean_liters_per_day"],
                    "intervention_mean_l_day_b": cmp["phase_b"]["intervention"]["mean_liters_per_day"],
                    "control_mean_l_day_a": cmp["phase_a"]["control"]["mean_liters_per_day"],
                    "control_mean_l_day_b": cmp["phase_b"]["control"]["mean_liters_per_day"],
                    "honesty": cmp["honesty"],
                }
            )
        except ValueError as exc:
            layers.append(
                {
                    "layer": label,
                    "phase_a": a,
                    "phase_b": b,
                    "ready": False,
                    "detail": str(exc),
                }
            )

    social = await get_social_field()
    return {
        "title": "Three-layer attribution (descriptive)",
        "layers": layers,
        "social_enabled": social["social_enabled"],
        "current_winner": social["current_week"].get("winner"),
        "honesty": "Pilot N is small — layers are descriptive, not powered causal proof.",
        "timezone": get_settings().campus_timezone,
        "generated_at": datetime.now(timezone.utc).isoformat(),
    }


async def public_social_board(board_id: str | None = None) -> dict[str, Any]:
    """Public board enriched with Phase 3 recognition label when social is on."""
    social = await get_social_field()
    bid = board_id or social["board_id"]
    view = await public_board_view(bid)
    if social["social_enabled"]:
        view["recognition"] = social["recognition_label"]
        view["subtitle"] = view.get("subtitle") or "Quiet recognition for lowest use"
        view["social_phase"] = True
    else:
        view["social_phase"] = False
    view["placement_hint"] = social["placement_location"] or None
    return view
