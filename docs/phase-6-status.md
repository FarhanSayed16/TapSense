# Phase 6 — Ingest Path (Status)

**Goal:** Device telemetry → readings → sessions → daily aggregates (HTTP + MQTT).

## Done

### 6.1 Device security
- Header `X-Device-Api-Key` (or `Bearer` device key)
- Must match `DEVICE_API_KEY` in `.env`
- Bad key → 401

### 6.2 MQTT
- Background Paho thread (Windows-safe) subscribes to `MQTT_TELEMETRY_TOPIC`
- Same `process_telemetry` path as HTTP

### 6.3 HTTP ingest
`POST /api/v1/ingest/telemetry`

### 6.4–6.6 Session / aggregate / last-seen
- Open session on liters flow
- Close on `session_end` or idle sweeper (`SESSION_IDLE_SECONDS`)
- Long-tail flags via `LONG_TAIL_LITERS` / `LONG_TAIL_SECONDS`
- Daily aggregate upsert on close
- Device `last_seen_at` updated every valid message

### 6.7 Verification (ran successfully)
```powershell
cd backend
.\.venv\Scripts\python -m scripts.simulate_ingest
```
Result: taps A/B/C each 1.25 L · `liters_today=3.75` · replay = duplicate · device online

## Gate
- [x] Simulated ingest E2E without ESP
- [x] Admin overview/sessions/daily APIs return that data

## Next → Phase 7
Frontend Glacier Ops shell + design system.
