# Phase 3 — Locked Conventions

These IDs and names are frozen for the MVP pilot. Seed scripts, firmware, and APIs must match.

---

## Timezone

| Setting | Value |
|---|---|
| Campus timezone | `Asia/Kolkata` |
| Daily aggregate cutover | Local midnight in `Asia/Kolkata` |
| Stored timestamps | Prefer UTC in DB; convert for day buckets using campus TZ |

---

## ID naming

| Entity | ID | Notes |
|---|---|---|
| Organization | `org_pilot` | Single college tenant for MVP |
| Campus | `campus_main` | |
| Building | `building_hostel` | Change label in seed if needed; keep id stable once data starts |
| Floor | `floor_1` | |
| Zone | `zone_washroom` | |
| Tap A (control) | `tap_a` | `is_control: true` |
| Tap B | `tap_b` | Intervention |
| Tap C | `tap_c` | Intervention |
| Device (ESP32) | `device_01` | Bound to tap_a, tap_b, tap_c |
| Admin user (seed) | `admin@tapsense.app` | Change password after first login |

Human-readable names (college/hostel) come from `docs/phase-1-site-lock.md` — update **display names** in seed, not these IDs, once baseline logging has started.

---

## MQTT

| Setting | Value |
|---|---|
| Broker (dev/pilot default) | `broker.hivemq.com` port `1883` (HiveMQ public — fine for pilot; swap to private later) |
| Telemetry topic | `tapsense/pilot/device_01/telemetry` |
| Topic pattern (scale later) | `tapsense/{org_id}/devices/{device_id}/telemetry` |
| Payload keys | `device_id`, `tap_id`, `ts`, `liters_delta`, `session_liters`, `session_end`, `message_id` |
| Device auth (HTTP fallback) | Header/API key `DEVICE_API_KEY` from backend `.env` |

Firmware `config.h` must use the same `DEVICE_ID` and `MQTT_TOPIC`.

---

## HTTP API

| Setting | Value |
|---|---|
| Local API | `http://localhost:8000` |
| Prefix | `/api/v1` |
| Health | `/health` and `/api/v1/health` |
| Frontend origin | `http://localhost:3000` |

---

## Database

| Setting | Value |
|---|---|
| MongoDB database name | `tapsense` |
| Atlas cluster name (suggested) | `tapsense-pilot` |

---

## Repo layout (canonical)

```
TapSense/
├── backend/          # FastAPI
├── frontend/         # Next.js admin
├── firmware/         # ESP32 Arduino (canonical)
├── hardware/         # Legacy mirror + pointer → firmware/
└── docs/             # Plans & checklists
```
