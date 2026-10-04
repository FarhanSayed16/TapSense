# Phase 19 — Scale-Out Wave 2

**Goal:** Leave 1-ESP×3-taps architecture without breaking the hierarchy schema.

---

## Architecture (locked)

| Mode | Use |
|---|---|
| `multi_tap` | Pilot `device_01` — 3 taps on one ESP (Wave 1) |
| `single_tap` | **Preferred for new installs** — 1 ESP → 1 YF-S201 |

Keep ≥1 control tap in the study design (Floor 1 Tap A remains control).

---

## What shipped

| Layer | Behavior |
|---|---|
| Ingest | Accepts any registered tap_id bound to a device (not hard-coded a/b/c) |
| Registry | `POST /devices` · `POST /taps` · location create building/floor/zone |
| Tree | `GET /locations/tree` · building/floor/zone dashboards |
| Overview | `?building_id=` scope + top-bar context switcher |
| UI | `/locations` · `/devices` fleet · building/floor/zone pages |
| Firmware | `firmware/tapsense_single_tap/tapsense_single_tap.ino` |
| Seed | `python -m scripts.seed_wave2` → Floor 2 + tap_d/e + device_02/03 |

---

## Enable Wave-2 demo data

```bash
cd backend
.\.venv\Scripts\python -m scripts.seed_wave2
```

Then open `/locations` — Floor 2 / Washroom F2 should appear with two single-tap ESPs.

---

## New ESP checklist

1. Register tap (`POST /taps` or seed) in the target zone  
2. Register device with `architecture: single_tap` and one `tap_id`  
3. Flash `tapsense_single_tap.ino` with matching `DEVICE_ID` / `TAP_ID` / WiFi / API URL  
4. Confirm device online on `/devices` and liters on tap detail  

---

## Hardware Wave 2 (field)

Order/install additional taps from Phase 1 backlog. Calibrate each. Keep control tap in design. Software does not require a second physical building to pass the **dev** gate — multi-floor / multi-zone seed demonstrates the schema.
