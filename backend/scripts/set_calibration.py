"""Update tap pulses-per-liter after bucket calibration (Phase 10).

Usage:
  .\\.venv\\Scripts\\python -m scripts.set_calibration --tap tap_a --ppl 455
  .\\.venv\\Scripts\\python -m scripts.set_calibration --tap tap_b --ppl 448 --note "2L bucket"
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

import httpx

from app.core.config import get_settings

API = "http://127.0.0.1:8000/api/v1"


def main() -> None:
    parser = argparse.ArgumentParser(description="Set tap calibration PPL")
    parser.add_argument("--tap", required=True, choices=["tap_a", "tap_b", "tap_c"])
    parser.add_argument("--ppl", required=True, type=float, help="pulses per liter")
    parser.add_argument("--note", default="Phase 10 bucket calibration")
    parser.add_argument("--api", default=API)
    args = parser.parse_args()

    settings = get_settings()
    with httpx.Client(timeout=15.0) as client:
        login = client.post(
            f"{args.api}/auth/login",
            json={"email": settings.admin_email, "password": settings.admin_password},
        )
        login.raise_for_status()
        token = login.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        res = client.patch(
            f"{args.api}/taps/{args.tap}/calibration",
            headers=headers,
            json={"pulses_per_liter": args.ppl, "note": args.note},
        )
        res.raise_for_status()
        print("Updated:", res.json())


if __name__ == "__main__":
    main()
