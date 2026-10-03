# Phase 5 — Data Model, Seed & Admin Auth (Status)

**Goal:** Hierarchy + 3 taps + device + admin login + protected read APIs.

## Done

### 5.1 Collections + indexes
- organizations, campuses, buildings, floors, zones, taps, devices, users  
- readings, sessions, daily_aggregates (empty until Phase 6)  
- Indexes on ids + `tap_id/ts`, `device_id/ts`, unique `message_id`

### 5.2 Seed
```powershell
cd backend
.\.venv\Scripts\python -m scripts.seed
```
Seeds org → washroom path, `tap_a` (control) / `tap_b` / `tap_c`, `device_01`, admin user.

### 5.3 Auth
| Method | Path | Notes |
|---|---|---|
| POST | `/api/v1/auth/login` | returns JWT |
| GET | `/api/v1/auth/me` | Bearer required |
| POST | `/api/v1/auth/logout` | client discards token |

**Default admin:** `admin@tapsense.app` / `TapSenseAdmin123!` (from `.env`)

### 5.4 Read APIs (Bearer)
| Path | Purpose |
|---|---|
| `GET /api/v1/taps` | list (+ `?role=control\|intervention`) |
| `GET /api/v1/taps/{id}` | detail |
| `GET /api/v1/sessions` | empty OK |
| `GET /api/v1/aggregates/daily` | empty OK |
| `GET /api/v1/devices` · `/devices/{id}` | health / last-seen |
| `GET /api/v1/overview` | floor summary for admin UI |

## Gate — verified locally
- [x] Seed runs clean (with Mongo Docker `tapsense-mongo`)
- [x] Admin login works
- [x] Taps A/B/C visible; `tap_a.is_control=true`
- [x] `/health` → `mongo: true`

## Next → Phase 6
MQTT + HTTP ingest → readings / sessions / daily aggregates.
