# Phase 9 — Firmware Bench (Status)

**Goal:** ESP proves 3-channel flow logging to cloud **on the bench** (no plumbing yet).

## Repo complete

### 9.1 Pin plan
Documented in `firmware/CONNECTIONS.md` · GPIO **27 / 26 / 25** · shared 5V/GND

### 9.2 Firmware features (`firmware/tapsense_pilot/`)
| Feature | Status |
|---|---|
| ISR capture A/B/C | Done |
| Debounce | Done |
| Liters conversion | Done |
| Session idle 5s | Done (matches backend) |
| WiFi reconnect | Done |
| MQTT publish | Done |
| HTTP ingest fallback (optional) | Done (`HTTP_INGEST_ENABLED`) |
| Watchdog | Done |
| Serial debug + `sim` commands | Done |
| NTP timestamp when available | Done |

### 9.3 Bench verification
Checklist for you: `firmware/BENCH.md`  
(Requires your WiFi credentials + hardware or Serial `sim`)

## Gate
| Item | Status |
|---|---|
| Firmware ready to upload | **Done** |
| 3 taps visible on Overview after sim/sensors | **You verify on bench** |
| No cross-wired IDs | **You verify** |

## Next
Phase 10 — field install + bucket calibration (only after Phase 9 gate).
