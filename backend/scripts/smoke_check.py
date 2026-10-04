"""Quick health smoke test through Phase 20. Run from backend/: python -m scripts.smoke_check"""

from __future__ import annotations

import sys
from pathlib import Path

import httpx

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

BASE = "http://127.0.0.1:8000"


def _password() -> str:
    pw = "TapSenseAdmin123!"
    env = ROOT / ".env"
    if env.exists():
        for line in env.read_text(encoding="utf-8").splitlines():
            if line.startswith("ADMIN_PASSWORD="):
                return line.split("=", 1)[1].strip().strip('"').strip("'")
    return pw


def main() -> int:
    results: list[tuple[bool, str, str]] = []

    def check(name: str, ok: bool, detail: str = "") -> None:
        results.append((ok, name, detail))
        mark = "PASS" if ok else "FAIL"
        print(f"[{mark}] {name}" + (f" — {detail}" if detail else ""))

    pw = _password()
    client = httpx.Client(base_url=BASE, timeout=20.0)

    r = client.get("/health")
    check("health", r.status_code == 200 and r.json().get("mongo") is True, r.text[:120])

    def login(email: str):
        resp = client.post("/api/v1/auth/login", json={"email": email, "password": pw})
        if resp.status_code != 200:
            return None, resp
        return resp.json()["access_token"], resp

    scenarios = [
        (
            "admin@tapsense.app",
            "org_admin",
            {"admin", "science", "members", "flags", "reset"},
            [],
            [
                ("GET", "/api/v1/overview?building_id=building_hostel"),
                ("GET", "/api/v1/devices"),
                ("GET", "/api/v1/taps"),
                ("GET", "/api/v1/sessions?limit=5"),
                ("GET", "/api/v1/locations/tree"),
                ("GET", "/api/v1/locations/buildings"),
                ("GET", "/api/v1/alerts?refresh=true"),
                ("GET", "/api/v1/org"),
                ("GET", "/api/v1/org/members"),
                ("GET", "/api/v1/product-phase"),
                ("GET", "/api/v1/phase-windows"),
                ("GET", "/api/v1/thresholds"),
                ("GET", "/api/v1/leaderboard/boards"),
                ("GET", "/api/v1/social-field"),
            ],
        ),
        (
            "facilities@tapsense.app",
            "facilities",
            {"monitor", "alerts_manage", "calibrate"},
            [
                ("POST", "/api/v1/admin/reset-today", None),
                ("GET", "/api/v1/org/members", None),
                ("PATCH", "/api/v1/product-phase", {"product_phase": 0}),
            ],
            [
                ("GET", "/api/v1/overview?building_id=building_hostel"),
                ("GET", "/api/v1/devices"),
                ("GET", "/api/v1/alerts?refresh=false"),
                ("GET", "/api/v1/org"),
                ("GET", "/api/v1/locations/buildings"),
            ],
        ),
        (
            "viewer@tapsense.app",
            "viewer",
            {"monitor"},
            [
                ("POST", "/api/v1/alerts/stale-device_01/ack", None),
                ("GET", "/api/v1/org/members", None),
                ("POST", "/api/v1/admin/reset-today", None),
            ],
            [
                ("GET", "/api/v1/overview?building_id=building_hostel"),
                ("GET", "/api/v1/devices"),
                ("GET", "/api/v1/alerts?refresh=false"),
            ],
        ),
    ]

    for email, expect_role, expect_caps, forbid_paths, allow_paths in scenarios:
        token, lr = login(email)
        check(f"login {email}", token is not None, f"status={lr.status_code}")
        if not token:
            continue
        h = {"Authorization": f"Bearer {token}"}
        me = client.get("/api/v1/auth/me", headers=h)
        body = me.json() if me.status_code == 200 else {}
        caps = set(body.get("capabilities") or [])
        check(
            f"me role {email}",
            body.get("role") == expect_role,
            f"role={body.get('role')} caps={sorted(caps)}",
        )
        check(
            f"caps {email}",
            expect_caps.issubset(caps),
            f"missing={sorted(expect_caps - caps)}",
        )
        for method, path in allow_paths:
            resp = client.request(method, path, headers=h)
            check(f"{expect_role} {method} {path}", resp.status_code == 200, f"status={resp.status_code}")
        for method, path, payload in forbid_paths:
            kwargs = {"headers": h}
            if payload is not None:
                kwargs["json"] = payload
            resp = client.request(method, path, **kwargs)
            check(
                f"{expect_role} FORBID {method} {path}",
                resp.status_code in (401, 403),
                f"status={resp.status_code}",
            )

    token, _ = login("admin@tapsense.app")
    h = {"Authorization": f"Bearer {token}"}
    for path in [
        "/api/v1/analytics/window?start=2026-10-01&end=2026-10-04",
        # Compare needs dates when Phase 1 window is unset (expected 400 without overrides)
        "/api/v1/analytics/compare?phase_a=0&phase_b=1&start_a=2026-09-20&end_a=2026-10-03&start_b=2026-10-01&end_b=2026-10-04",
        "/api/v1/analytics/control-vs-intervention?start=2026-10-01&end=2026-10-04",
        "/api/v1/exports/daily?start=2026-10-01&end=2026-10-04&format=json",
    ]:
        resp = client.get(path, headers=h)
        check(f"admin {path.split('?')[0]}", resp.status_code == 200, f"status={resp.status_code}")

    resp = client.get("/api/v1/visibility/live")
    check("public visibility", resp.status_code == 200, f"phase={resp.json().get('product_phase')}")

    resp = client.get("/api/v1/overview?building_id=building_hostel", headers=h)
    ov = resp.json()
    check(
        "overview taps",
        resp.status_code == 200 and isinstance(ov.get("taps"), list) and len(ov["taps"]) >= 3,
        f"taps={len(ov.get('taps', []))}",
    )
    check("overview health mongo", ov.get("health", {}).get("mongo") is True, str(ov.get("health")))

    resp = client.get("/api/v1/devices", headers=h)
    devs = resp.json()
    check(
        "devices list",
        resp.status_code == 200 and isinstance(devs, list) and len(devs) >= 1,
        f"count={len(devs) if isinstance(devs, list) else 'err'}",
    )

    resp = client.get("/api/v1/locations/tree", headers=h)
    check("locations tree", resp.status_code == 200 and "campuses" in resp.json(), str(list(resp.json().keys())[:5]))

    fails = [x for x in results if not x[0]]
    print("\n=== SUMMARY ===")
    print(f"passed={sum(1 for x in results if x[0])} failed={len(fails)} total={len(results)}")
    if fails:
        print("FAILURES:")
        for _, name, detail in fails:
            print(f" - {name}: {detail}")
        return 1
    print("ALL CHECKS PASSED")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
