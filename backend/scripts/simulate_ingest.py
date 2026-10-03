"""Simulate 3-tap telemetry via HTTP ingest (Phase 6 verification).

Usage:
  .\\.venv\\Scripts\\python -m scripts.simulate_ingest
"""

from __future__ import annotations

import json
import sys
import time
import uuid
from pathlib import Path

import httpx

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from app.core.config import get_settings

API = "http://127.0.0.1:8000/api/v1"


def main() -> None:
    settings = get_settings()
    headers = {"X-Device-Api-Key": settings.device_api_key}

    with httpx.Client(timeout=10.0) as client:
        # reject bad key
        bad = client.post(
            f"{API}/ingest/telemetry",
            headers={"X-Device-Api-Key": "wrong"},
            json={"device_id": "device_01", "tap_id": "tap_a", "liters_delta": 0.1, "message_id": "bad-1"},
        )
        print("bad key ->", bad.status_code)

        for tap in ("tap_a", "tap_b", "tap_c"):
            mid = f"sim-{tap}-{uuid.uuid4()}"
            body = {
                "device_id": "device_01",
                "tap_id": tap,
                "liters_delta": 1.25,
                "session_liters": 1.25,
                "session_end": False,
                "message_id": mid,
                "ts": int(time.time()),
            }
            r = client.post(f"{API}/ingest/telemetry", headers=headers, json=body)
            print(tap, "flow ->", r.status_code, r.json())

            # idempotent replay
            r2 = client.post(f"{API}/ingest/telemetry", headers=headers, json=body)
            print(tap, "replay ->", r2.json())

            end = {
                **body,
                "liters_delta": 0,
                "session_end": True,
                "message_id": f"{mid}-end",
            }
            r3 = client.post(f"{API}/ingest/telemetry", headers=headers, json=end)
            print(tap, "end ->", r3.status_code, r3.json())

        login = client.post(
            f"{API}/auth/login",
            json={"email": settings.admin_email, "password": settings.admin_password},
        )
        login.raise_for_status()
        token = login.json()["access_token"]
        auth = {"Authorization": f"Bearer {token}"}
        overview = client.get(f"{API}/overview", headers=auth).json()
        sessions = client.get(f"{API}/sessions", headers=auth).json()
        daily = client.get(f"{API}/aggregates/daily?days=1", headers=auth).json()
        device = client.get(f"{API}/devices/device_01", headers=auth).json()
        print("overview liters_today=", overview.get("liters_today"))
        print("sessions=", len(sessions), "daily=", daily)
        print("device status=", device.get("status"), "last_seen=", device.get("last_seen_at"))


if __name__ == "__main__":
    main()
