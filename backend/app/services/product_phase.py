"""Product science phase helpers (Phase 0 silent → Phase 1 visibility → …)."""

from __future__ import annotations

from datetime import datetime, timezone

from app.db.mongo import get_db
from app.schemas.auth import ProductPhaseOut

PHASE_LABELS = {
    0: "Phase 0 — Baseline",
    1: "Phase 1 — Visibility",
    2: "Phase 2 — Color",
    3: "Phase 3 — Social",
}

SETTINGS_ID = "pilot_main"


def phase_label(phase: int) -> str:
    return PHASE_LABELS.get(int(phase), f"Phase {phase}")


async def get_product_phase_doc() -> dict:
    db = get_db()
    doc = await db.pilot_settings.find_one({"id": SETTINGS_ID}, {"_id": 0})
    if not doc:
        now = datetime.now(timezone.utc)
        doc = {
            "id": SETTINGS_ID,
            "product_phase": 0,
            "created_at": now,
            "updated_at": now,
        }
        await db.pilot_settings.update_one({"id": SETTINGS_ID}, {"$set": doc}, upsert=True)
    return doc


async def get_product_phase() -> ProductPhaseOut:
    doc = await get_product_phase_doc()
    phase = int(doc.get("product_phase", 0))
    if phase not in (0, 1, 2, 3):
        phase = 0
    return ProductPhaseOut(
        product_phase=phase,  # type: ignore[arg-type]
        label=phase_label(phase),
        visibility_enabled=phase >= 1,
        color_enabled=phase >= 2,
        social_enabled=phase >= 3,
        updated_at=doc.get("updated_at"),
    )


async def set_product_phase(phase: int, updated_by: str | None = None) -> ProductPhaseOut:
    if phase not in (0, 1, 2, 3):
        raise ValueError("product_phase must be 0–3")
    now = datetime.now(timezone.utc)
    await get_db().pilot_settings.update_one(
        {"id": SETTINGS_ID},
        {
            "$set": {
                "id": SETTINGS_ID,
                "product_phase": phase,
                "updated_at": now,
                "updated_by": updated_by,
            },
            "$setOnInsert": {"created_at": now},
        },
        upsert=True,
    )
    return await get_product_phase()
