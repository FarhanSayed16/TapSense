# TapSense — Demo Runbook (professor / faculty)

**Goal:** Bring the live pilot up cold in under 5 minutes and run a clean 5–10 minute showcase.

---

## Preflight (T−10 minutes)

### Laptop
- [ ] Plugged in; **Sleep = Never** while on AC (Windows Power Options)
- [ ] Connected to **same 2.4 GHz Wi‑Fi** as the ESP (`Jiofiber`, not `*_5G`)
- [ ] Note PC Wi‑Fi IP: `ipconfig` → IPv4 (example `192.168.0.100`)
- [ ] If IP ≠ value in firmware `HTTP_INGEST_URL`, update `.ino` and re-upload

### Windows Firewall
- [ ] Allow inbound **TCP 8000** for Python/uvicorn (Private networks)

### Hardware
- [ ] Barrel / battery power on (USB only if you need Serial debug)
- [ ] LCD backlight on; sensors powered from **5 V** rail; common **GND**
- [ ] Pipe labels: **1 = tap_a (control)**, **2 = tap_b**, **3 = tap_c**

---

## Start software

**Terminal 1 — API (must bind all interfaces for ESP):**

```powershell
cd d:\TapSense\backend
.\.venv\Scripts\uvicorn app.main:app --host 0.0.0.0 --port 8000
```

**Terminal 2 — Admin UI:**

```powershell
cd d:\TapSense\frontend
npm run dev
```

**Checks:**

```powershell
Invoke-RestMethod http://127.0.0.1:8000/api/v1/health
```

Expect: `status=ok`, `mongo=true`, `db=tapsense`.

Open http://localhost:3000 → login  
`admin@tapsense.app` / `TapSenseAdmin123!`

---

## ESP live check

1. Power board → LCD: Wi‑Fi OK / IP (or Serial: `[wifi] ok`)  
2. Overview → Device **online**  
3. Open **one** faucet → liters / active session update within ~3s  
4. Serial (optional): `[http] POST 200` with `"duplicate":false`

If HTTP fails: confirm API on `0.0.0.0`, same Wi‑Fi, firewall, correct PC IP in firmware.

---

## Faculty demo script (~6 minutes)

| Time | Say / do | Show |
|---|---|---|
| 0:00 | TapSense pilot — washroom tap sensing for behavior research | Login → Overview |
| 0:45 | Phase 0 silent baseline; Tap A is **control** (no guilt UI) | Phase 0 badge + explainer |
| 1:30 | Live device path: ESP → Wi‑Fi → API → Mongo → dashboard | Device online + health strip |
| 2:30 | Open Tap A briefly | Active session / liters move |
| 3:30 | Open Tap B — independent channel | Tap B card updates alone |
| 4:30 | Evidence log | Sessions table |
| 5:30 | Limits: 3 taps, approx calibration, campus pilot | Honest close |

**Do not** click **Reset today** during the demo (Settings only).

---

## If something breaks mid-demo

| Symptom | Fix |
|---|---|
| Device stale | Power-cycle ESP; check Wi‑Fi |
| Liters not moving | Confirm API `0.0.0.0`; Serial `duplicate:false` |
| Login CORS / 500 | Restart API from `backend/` with `.env` Atlas URI |
| Empty Overview | Seed once: `python -m scripts.seed` |
| LCD blank | 5 V + GND; I2C address `0x27` / try `0x3F` |

---

## After demo

- [ ] Optional: Settings → Reset today (only if you want a clean day)  
- [ ] Next field track: bucket calibration → Phase 11 baseline  

Related: `docs/SHOWCASE-RELIABILITY-PLAN.md` · `docs/GO-LIVE.md` · `docs/SHOWCASE-ONEPAGER.md`
