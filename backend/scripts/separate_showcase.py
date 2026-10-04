"""Move any Wave-2 demo assets out of the pilot washroom into Showcase Wing.

Usage (from backend/):
  .\\.venv\\Scripts\\python -m scripts.separate_showcase
"""

from __future__ import annotations

import asyncio
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from app.db.mongo import close_db, get_db, ping_db
from app.services.deployment import ensure_pilot_and_showcase_tagged
from app.services.org import update_feature_flags


async def main() -> None:
    if not await ping_db():
        raise SystemExit("MongoDB not reachable")
    try:
        result = await ensure_pilot_and_showcase_tagged("org_pilot")
        # Force pilot-facing UI after separation (professor demo can re-enable later)
        org = await update_feature_flags("org_pilot", {"showcase_scale": False}, updated_by="separate_showcase")
        result["showcase_scale"] = org["feature_flags"].get("showcase_scale", False)
        # Clear stale building selection confusion: nothing to do server-side
        _ = get_db()
        print("Showcase separation OK")
        for k, v in result.items():
            print(f"  {k}={v}")
        print("Pilot UI stays 3 taps while showcase_scale=false")
    finally:
        await close_db()


if __name__ == "__main__":
    asyncio.run(main())
