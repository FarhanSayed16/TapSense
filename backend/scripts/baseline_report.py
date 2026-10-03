"""Generate Phase 11 baseline metrics report from MongoDB.

Usage:
  .\\.venv\\Scripts\\python -m scripts.baseline_report --start 2026-10-01 --end 2026-10-14
"""

from __future__ import annotations

import argparse
import asyncio
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

REPO_DOCS = ROOT.parent / "docs" / "baseline-reports"

from app.db.mongo import close_db, ping_db
from app.services.baseline import build_baseline_report, report_to_markdown


async def _amain(start: str, end: str, out_dir: Path) -> None:
    try:
        if not await ping_db():
            raise SystemExit("MongoDB not reachable")

        report = await build_baseline_report(start, end)
        out_dir.mkdir(parents=True, exist_ok=True)
        stem = f"baseline_{start.replace('-', '')}_{end.replace('-', '')}"
        json_path = out_dir / f"{stem}.json"
        md_path = out_dir / f"{stem}.md"
        json_path.write_text(json.dumps(report, indent=2), encoding="utf-8")
        md_path.write_text(report_to_markdown(report), encoding="utf-8")
        print(f"Wrote {json_path}")
        print(f"Wrote {md_path}")
        print(
            f"long_tail_volume_pct={report['overall']['long_tail_volume_pct']} "
            f"suggested_go={report['suggested_go_for_phase1']}"
        )
    finally:
        await close_db()


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--start", required=True, help="YYYY-MM-DD")
    parser.add_argument("--end", required=True, help="YYYY-MM-DD")
    parser.add_argument("--out", default=str(REPO_DOCS), help="output directory")
    args = parser.parse_args()
    asyncio.run(_amain(args.start, args.end, Path(args.out)))


if __name__ == "__main__":
    main()
