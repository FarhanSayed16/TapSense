# TapSense — MVP Plan (Pilot)

**Status:** Active working plan for the first working product  
**Scope:** 1 ESP32 · 3 flow sensors · 3 taps · 1 floor washroom · Phases 0–1 focus  
**Stack:** ESP32 firmware · MQTT · FastAPI · MongoDB Atlas · Next.js (admin)  
**Depends on:** `docs/water-tap-project-master-doc.md` (product decisions)  
**Continues into:** `docs/backend-plan.md` (full backend) · `docs/frontend-mvp-plan.md` → `docs/frontend-plan.md` (UI)  
**Execute with:** `docs/mvp-master-execution-plan.md` (pilot zoom-in) · `docs/full-master-execution-plan.md` ← **full end-to-end checklist (24 phases)**

---

## 1. MVP Goal

Prove the core loop end-to-end:

1. Water flows through a tap  
2. Sensor pulses are counted  
3. Liters are calculated per tap  
4. Data reaches the cloud  
5. Admin can see usage on a dashboard  

No bulk meter. No auto-cutoff valve. No student app. No multi-college UI.  
If this loop works on 3 taps, the full product can grow without rewiring the idea.

---

## 2. What MVP Includes

### In scope
- 1 ESP32 handling 3 YF-S201 flow sensors (3 taps)
- Silent baseline logging (Phase 0)
- Live liter tracking per tap (Phase 1 readiness)
- One control tap (sensor only, no display feedback later)
- Two intervention taps (eligible for display in later pilot steps)
- Hierarchical data model ready for scale (org → campus → building → floor → zone → tap)
- MQTT ingest into FastAPI → MongoDB
- Admin-only monitoring dashboard
- Daily / weekly totals per tap
- Session detection (flow start → idle stop)
- Basic health: last-seen timestamp per device / tap

### Explicitly out of scope for MVP
- Custom PCB
- Solenoid / auto-cutoff (Phase 4)
- LED color thresholds (Phase 2) — schema may reserve fields, UI not required
- Block leaderboard UX polish (Phase 3) — optional placeholder only
- Individual / ID tracking
- Multi-organization UI
- Telegram digests
- Leak detection ML / anomaly engine
- Cost-to-₹ translation
- Public student-facing product UI
- App gamification (points, streaks)

---

## 3. Pilot Hardware Setup

| Item | Qty | Role |
|---|---|---|
| ESP32 DevKit | 1 | Controller + WiFi |
| YF-S201 flow sensor | 3 | One per tap |
| IP-rated enclosure | 1+ | Protect ESP near water |
| 5V power + wiring | 1 set | Power ESP + sensors |
| Pipe fittings + PTFE tape | as needed | Inline install without leaks |
| WS2812 LED / OLED | 0–2 | Optional after Phase 0; skip on control tap |

**Tap assignment**
- Tap A — Control (log only; no visual feedback in later phases)
- Tap B — Intervention
- Tap C — Intervention

**Install rule:** keep sensor wires short; all 3 taps must be close enough for one ESP (same washroom).

---

## 4. MVP Success Criteria

MVP is “done” when all of the following are true:

- [ ] Facilities / warden written sign-off obtained  
- [ ] 3 sensors installed and sealed without active leaks  
- [ ] WiFi reaches the ESP (or documented SD-buffer fallback plan)  
- [ ] Each tap publishes liters with a stable `tap_id`  
- [ ] Backend stores raw pulse/session events and daily aggregates  
- [ ] Admin can log in and see last 24h / 7d usage per tap  
- [ ] Control tap is flagged and distinguishable in data  
- [ ] Calibration done once (bucket test → pulses-per-liter)  
- [ ] 10–14 days of Phase 0 baseline collected (or collection running cleanly)

---

## 5. Implementation Phases (MVP)

### Step A — Foundations (software, before / while hardware arrives)
- Create repo structure for backend + frontend + firmware stubs
- Define env config (MQTT, MongoDB, JWT secret, CORS)
- Seed hierarchical locations for the pilot floor only
- Stand up empty ingest + health endpoints
- Deploy skeleton backend (Render) + empty admin app (Vercel)

### Step B — Ingest path
- MQTT topic convention for device → backend
- Ingest service validates device token / API key
- Persist readings and compute session boundaries
- Aggregate daily totals job (cron or on-write update)

### Step C — Admin monitoring UI
- Login
- Tap list (3 taps) with status (online / stale)
- Tap detail: live or recent liters, sessions, daily chart
- Floor summary card (sum of 3 taps)

### Step D — Firmware on hardware
- Pulse ISRs for 3 GPIOs
- Liter conversion + session idle timeout
- MQTT publish with tap_id, liters, timestamp
- Reconnect / watchdog basics

### Step E — Field pilot (Phase 0)
- Install, waterproof, verify
- Silent logging 10–14 days
- Export / review baseline metrics
- Gate: confirm measurable long-tail waste before adding displays

### Step F — Phase 1 readiness (still MVP stretch)
- Show live liter counter on intervention taps (firmware display)
- Dashboard reflects same session volumes
- Same-tap / same-weekday comparison notes for report

---

## 6. MVP Module Map (what exists, not how coded)

### 6.1 Firmware module
- Sensor pulse capture  
- Liter calculation  
- Session start / end  
- MQTT publisher  
- Device identity (device_id)  
- Optional display driver (post Phase 0)

### 6.2 Messaging module
- Broker connection  
- Topic layout  
- Payload shape (tap_id, liters_delta or total, ts, session_id)  
- Device auth secret / token

### 6.3 Backend core modules (MVP subset)
- Auth (admin only)  
- Organizations / locations (seeded, minimal CRUD)  
- Taps registry  
- Ingest / telemetry  
- Sessions  
- Aggregates (daily)  
- Health / device last-seen  
- Admin read APIs for dashboard

### 6.4 Frontend modules (MVP subset)
- Auth screens  
- Overview (floor / 3 taps)  
- Tap detail  
- Simple charts (daily totals)  
- Device status indicators  

### 6.5 Ops / config
- Environment variables  
- Seed script for college → building → floor → 3 taps  
- Deployment notes (Render + Vercel + Atlas + MQTT)

---

## 7. Data Entities Used in MVP

Keep names stable so full backend can extend them later.

| Entity | MVP use |
|---|---|
| Organization | Single college record |
| Campus | One campus |
| Building | One building / hostel |
| Floor | One floor |
| Zone | One washroom |
| Tap | Three taps (A/B/C) |
| Device | One ESP32 linked to three taps |
| Reading / Telemetry | Incoming flow updates |
| Session | One continuous use event |
| DailyAggregate | Per-tap day totals |
| User | Admin accounts only |
| ControlFlag | Tap A marked `is_control = true` |

---

## 8. Communication Flow (MVP)

```
Tap water
  → YF-S201 pulses
  → ESP32 (count → liters → session)
  → MQTT publish (device_id, tap_id, liters, ts)
  → FastAPI ingest service
  → MongoDB (readings + sessions + daily aggregates)
  → Next.js admin dashboard (poll or light refresh)
```

**Calculation rule (conceptual)**  
- Calibrated pulses-per-liter constant per sensor  
- Session ends after N seconds of zero flow  
- Daily total = sum of session liters for that calendar day (campus timezone)

---

## 9. Admin Features Checklist (MVP)

- [ ] Login / logout  
- [ ] See 3 taps and online status  
- [ ] See liters today / this week per tap  
- [ ] See recent sessions list  
- [ ] See which tap is control  
- [ ] Manual note field optional (install notes)  
- [ ] No public leaderboard required yet  

---

## 10. Risks Specific to This MVP

| Risk | Mitigation |
|---|---|
| Washroom WiFi weak | Test week 1; plan SD buffer if needed |
| Leak at sensor joint | Facilities help + PTFE + pressure check |
| One ESP failure = 3 taps dark | Acceptable for MVP; later 1 ESP/tap |
| Pulse noise on longer wires | Keep wiring short; debounce in firmware |
| Overbuilding UI | Stick to admin monitor only |

---

## 11. Deliverables When MVP Closes

1. Working 3-tap logging pipeline  
2. Admin dashboard with real data  
3. Seeded location hierarchy matching college structure (narrow instance of broad model)  
4. Phase 0 baseline dataset (or clean running collection)  
5. Short handoff note into full backend plan (`docs/backend-plan.md`)

---

## 12. What Happens After MVP

| Next | From which plan |
|---|---|
| Phase 2 color cue | Master doc + firmware + light backend thresholds |
| Phase 3 leaderboard | Backend aggregates by floor/block + frontend board |
| Multi-building / multi-org | Full backend plan modules |
| 1 ESP per tap scale-out | Device registry expansion |
| Phase 4 valve | Separate facilities approval + new hardware module |

**Rule:** Do not start full multi-tenant product UI until MVP success criteria above are met.

---

## 13. Immediate Next Actions

1. Order: 1 ESP32 + 3× YF-S201 + enclosure + power + fittings  
2. Create backend + frontend skeleton repos / folders per `backend-plan.md` MVP slice  
3. Seed one org → … → 3 taps  
4. Get facilities sign-off draft  
5. Confirm washroom WiFi  

---

*This file is the single source of truth for what “MVP done” means. Broader architecture lives in `docs/backend-plan.md`.*
