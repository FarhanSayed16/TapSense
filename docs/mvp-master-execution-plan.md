# TapSense — MVP / Pilot Master Execution Plan

**Status:** FINAL CHECKLIST for pilot execution (use this to build and sign off)  
**Scope:** MVP only — 1 ESP32 · 3× YF-S201 · 3 taps · 1 washroom · admin monitoring · Phase 0 baseline (+ Phase 1 readiness)  
**This file combines:** `water-tap-project-master-doc.md` (decisions) · `mvp-plan.md` · `frontend-mvp-plan.md` · `backend-plan.md` (B0–B1 only)  
**Not in this file:** post-MVP product scale — use `docs/full-master-execution-plan.md` (Phases 13–24) after Phase 12 here  
**Full project checklist:** `docs/full-master-execution-plan.md` (24 phases end-to-end)  

**How to use:** Work phase by phase. Do not skip gates. Check every box before marking a phase complete.

---

## Locked Decisions (Do Not Re-Argue Mid-Pilot)

| Decision | Final |
|---|---|
| Bulk meter | **Not required** |
| ESP count (pilot) | **1 ESP → 3 taps** |
| PCB | **No** — DevKit + wiring + IP box |
| Tracking | **Tap / block only** — never per-person |
| Guilt UI copy | **Never** |
| Control tap | **Tap A** — sensor only, no display later |
| Intervention taps | **Tap B, Tap C** |
| Stack | ESP32 · MQTT · FastAPI · MongoDB Atlas · Next.js |
| Hosting | Render (API) · Vercel (web) · Atlas · HiveMQ/Mosquitto |
| Design system | **Glacier Ops** (see frontend MVP plan) |
| No bulk meter / no valve / no public student app in MVP | Confirmed |

### End-to-end flow (must work)

```
Water → YF-S201 pulses → ESP32 (liters + sessions)
  → MQTT → FastAPI ingest → MongoDB
  → Next.js admin dashboard
```

### MVP done when
All **Phase 12 exit criteria** are checked.

---

## Phase Map (12 Phases)

| # | Phase | Outcome |
|---|---|---|
| 1 | Permissions & site lock | Written approval + 3 taps chosen |
| 2 | Hardware procurement | Kit ordered & received |
| 3 | Repo & environment foundations | Projects + env + deploy skeletons |
| 4 | Backend B0 skeleton | API boots, health, Mongo connected |
| 5 | Backend B1 data + auth | Hierarchy seed, taps, admin auth |
| 6 | Backend B1 ingest path | MQTT → readings → sessions → daily totals |
| 7 | Frontend design system + shell | Glacier Ops + nav shell |
| 8 | Frontend MVP pages | Login → Overview → Taps → Sessions → Device |
| 9 | Firmware (bench) | 3 sensors counting + MQTT on desk |
| 10 | Field install & calibration | On taps, sealed, calibrated, online |
| 11 | Phase 0 baseline run | 10–14 days silent logging + review |
| 12 | MVP closeout & Phase 1 readiness | Dashboard proven + handoff notes |

---

# PHASE 1 — Permissions & Site Lock

**Goal:** Legal/admin clearance and fixed science design before buying or coding against wrong taps.

### 1.1 Facilities approval
- [ ] Draft one-page proposal (what, where, how long, Phases 0–1 = measure only, no valve)
- [ ] Meet hostel warden / facilities
- [ ] Get **written** sign-off
- [ ] Confirm who to call if a joint leaks

### 1.2 Tap selection (freeze before data)
- [ ] Pick **3 taps** in **one washroom** (short wiring for 1 ESP)
- [ ] Label permanently: **A = control**, **B = intervention**, **C = intervention**
- [ ] Photo each tap location (before install)
- [ ] Write location path: College → Campus → Building → Floor → Zone → Taps

### 1.3 Site constraints
- [ ] Check power availability near washroom
- [ ] Check WiFi signal at install height (phone test minimum)
- [ ] Note fallback if WiFi dead: SD-card log + periodic sync (document only for now)
- [ ] Confirm water can be shut briefly for inline sensor fit

### Phase 1 gate
- [ ] Written approval filed
- [ ] Tap A/B/C locked in writing (no changing after Phase 11 starts)

---

# PHASE 2 — Hardware Procurement

**Goal:** All physical parts for the 3-tap pilot in hand.

### 2.1 Order list
- [ ] 1× ESP32 DevKit
- [ ] 3× YF-S201 flow sensors
- [ ] 1× IP-rated enclosure (or more if splitting)
- [ ] 5V power supply suitable for ESP + sensors
- [ ] Wiring, connectors, breadboard/proto as needed
- [ ] Pipe fittings / adapters for inline mount
- [ ] PTFE tape
- [ ] Optional later (not blocking Phase 0): 1–2× WS2812 ring or 0.96" OLED for Tap B/C only

### 2.2 Receive & inventory
- [ ] Verify all parts against list
- [ ] Smoke-test ESP32 powers via USB
- [ ] Visually inspect sensors (arrow marking, threads)

### Phase 2 gate
- [ ] Full kit received and inventoried

---

# PHASE 3 — Repo & Environment Foundations

**Goal:** Single project structure so backend, frontend, firmware do not fork chaotically.  
**Status doc:** `docs/phase-3-status.md` · **Conventions:** `docs/phase-3-conventions.md` · **Accounts:** `docs/phase-3-accounts-checklist.md`

### 3.1 Repository structure
- [x] Create / confirm monorepo or clear multi-folder layout: `backend/`, `frontend/`, `firmware/`
- [x] Add root README pointing to this master execution plan
- [x] Add `.env.example` files (no secrets committed)

### 3.2 Accounts & services (create, even if empty)
- [ ] MongoDB Atlas cluster + database name decided → use checklist (`tapsense` DB name locked)
- [x] MQTT broker account/instance (HiveMQ free or Mosquitto host) → default `broker.hivemq.com` locked
- [ ] Render service placeholder for FastAPI
- [ ] Vercel project placeholder for Next.js
- [ ] Shared password manager / notes for credentials (not in git)

### 3.3 Conventions locked
- [x] Timezone for college campus decided (for daily aggregates) → `Asia/Kolkata`
- [x] ID naming: `org_pilot`, `tap_a`, `tap_b`, `tap_c`, `device_01`
- [x] MQTT topic prefix decided → `tapsense/pilot/device_01/telemetry`

### Phase 3 gate
- [x] Folders exist
- [x] Env examples exist
- [ ] Cloud accounts reachable → **you:** Atlas (+ Render/Vercel) via `docs/phase-3-accounts-checklist.md`

---

# PHASE 4 — Backend B0 Skeleton

**Goal:** FastAPI app runs, connects to Mongo, exposes health — no business features yet.  
**Status doc:** `docs/phase-4-status.md` · **Deploy prep:** `render.yaml`

### 4.1 Project layout (per backend plan)
- [x] `app/main` entry
- [x] `app/core` config + logging
- [x] `app/db` Mongo client
- [x] Empty `api/`, `services/`, `mqtt/`, `models/`, `schemas/`
- [x] `scripts/` folder for seed later

### 4.2 Core wiring
- [x] Load env (Mongo URI, JWT secret placeholder, CORS origins, MQTT later)
- [x] Health route returns ok (`ok` or `degraded`)
- [x] Mongo ping on startup (or health check)
- [x] CORS allows local frontend origin

### 4.3 Deploy skeleton
- [x] `render.yaml` prepared for Render Web Service `tapsense-api`
- [ ] Deploy to Render (or equivalent) — **your account**
- [ ] Public `/health` works — after deploy

### Phase 4 gate
- [x] Local health responds (verified on `:8000`)
- [ ] Deployed health OK — after you deploy
- [ ] Mongo connected — start Docker Desktop `tapsense-mongo` or set Atlas `MONGODB_URI`

---

# PHASE 5 — Backend B1 Data Model, Seed & Admin Auth

**Goal:** Hierarchy + 3 taps + one device + admin login exist in DB/API.  
**Status doc:** `docs/phase-5-status.md`

### 5.1 Models / collections (MVP entities)
- [x] Organization
- [x] Campus
- [x] Building
- [x] Floor
- [x] Zone
- [x] Tap (`is_control` on Tap A)
- [x] Device (one ESP bound to A/B/C)
- [x] User (admin)
- [x] Reading / Session / DailyAggregate collections created (even if empty)
- [x] Indexes planned: tap_id + timestamp; device_id + timestamp

### 5.2 Seed script
- [x] Seed exact pilot path for your college washroom
- [x] Seed Tap A control + B/C intervention
- [x] Seed Device `device_01` bound to three taps
- [x] Seed default calibration placeholder (replace after bucket test)
- [x] Seed first admin user

### 5.3 Auth module (admin only)
- [x] Login endpoint
- [x] JWT issue + `/me`
- [x] Logout / token invalidate strategy (as chosen) — client discards JWT
- [x] Protect admin read routes

### 5.4 Read APIs (can return empty data)
- [x] List taps
- [x] Get tap by id
- [x] List sessions (empty OK)
- [x] Daily aggregates (empty OK)
- [x] Device health / last-seen (null OK)

### Phase 5 gate
- [x] Seed runs clean
- [x] Admin can login via API
- [x] Taps A/B/C visible with control flag

---

# PHASE 6 — Backend B1 Ingest Path (MQTT → Data)

**Goal:** Real or simulated device messages become readings, sessions, and daily totals.  
**Status doc:** `docs/phase-6-status.md`

### 6.1 Device security
- [x] Device API key / token issued for `device_01`
- [x] Ingest rejects bad credentials

### 6.2 MQTT service
- [x] Broker connect from backend
- [x] Subscribe to device telemetry topic
- [x] Parse payload: device_id, tap_id, timestamp, liters (delta or cumulative), message_id
- [x] Dedupe by message_id / sequence

### 6.3 HTTP ingest fallback (recommended)
- [x] Same validation path as MQTT (for bench testing without broker flakiness)

### 6.4 Session engine
- [x] Session starts on flow
- [x] Session ends after N seconds idle (constant in config)
- [x] Store liters + duration per session
- [x] Optional long-tail flag if duration or liters above threshold

### 6.5 Aggregation
- [x] Update daily per-tap totals on session close (or scheduled reconcile)
- [x] Week totals derivable for dashboard

### 6.6 Device last-seen
- [x] Update on every valid message
- [x] Stale rule defined (e.g. no message > X minutes)

### 6.7 Verification
- [x] Send 3 fake tap messages (A/B/C) → appear in Mongo
- [x] Sessions form correctly
- [x] Daily aggregate increments
- [x] Idempotent replay does not double-count

### Phase 6 gate
- [x] Simulated ingest works end-to-end without ESP
- [x] Admin read APIs return that simulated data

---

# PHASE 7 — Frontend Design System + App Shell

**Goal:** Glacier Ops locked; scalable shell ready before pages.  
**Status doc:** `docs/phase-7-status.md`

### 7.1 App bootstrap
- [x] Next.js + Tailwind project
- [x] Fonts: Outfit + Sora + mono for numbers
- [x] Lucide icons set

### 7.2 Design tokens (Glacier Ops)
- [x] CSS variables for bg, surface, ink, muted, brand, accent, line, ok/warn/danger, control
- [x] Atmospheric page background (mist + soft aqua) — not flat white, not purple
- [x] Spacing 8px grid

### 7.3 Base components
- [x] Button (primary / ghost / danger)
- [x] Input + label
- [x] Badge (control / phase / status)
- [x] KPI stat
- [x] Data table
- [x] Empty state
- [x] Skeleton
- [x] Toast
- [x] Sidebar nav item

### 7.4 Shell
- [x] Sidebar: Overview, Taps, Sessions, Device, Settings
- [x] Top bar: location crumb, phase pill (“Phase 0 — Baseline”), user menu
- [x] Mobile drawer
- [x] Auth route guard wrapper

### 7.5 Motion baseline
- [x] Page enter fade+rise
- [x] Online status pulse
- [x] KPI metric settle
- [x] `prefers-reduced-motion` respected

### Phase 7 gate
- [x] Shell renders on desktop + phone
- [x] Tokens consistent; no Inter/Roboto/purple theme drift

---

# PHASE 8 — Frontend MVP Pages (Wired to Backend)

**Goal:** Full admin monitoring UI against real B1 APIs.  
**Status doc:** `docs/phase-8-status.md`

### 8.1 Login (`/login`)
- [x] Brand wordmark hero-level
- [x] Email/password + errors
- [x] Session restore works
- [x] Atmospheric login background

### 8.2 Overview (`/`)
- [x] Crumb shows seeded location
- [x] KPIs: today L, week L, active sessions, device online
- [x] Tap status strip for A/B/C with control badge on A
- [x] 7-day mini trend chart
- [x] Phase 0 badge
- [x] Stale device amber banner when applicable
- [x] Honest empty state if no data yet

### 8.3 Taps list (`/taps`)
- [x] Columns: tap, role, today, week, last seen
- [x] Filter: All / Control / Intervention
- [x] Navigate to detail

### 8.4 Tap detail (`/taps/[tapId]`)
- [x] Header + control badge + online state
- [x] KPIs + 7d/14d daily chart
- [x] Recent sessions table
- [x] Calibration read-only if present
- [x] Link to device

### 8.5 Sessions (`/sessions`)
- [x] Filters: tap, date range
- [x] Columns: start, end, duration, liters, tap, long-tail flag
- [x] Empty copy for early pilot

### 8.6 Device (`/device`)
- [x] Device id, last seen, bound taps A/B/C
- [x] Stale callout
- [x] No command buttons

### 8.7 Settings (minimal)
- [x] Profile / logout only

### 8.8 Quality pass
- [x] Loading skeletons
- [x] Error + retry
- [x] No fake production demo numbers
- [x] Privacy: no person-level language
- [ ] Deploy to Vercel against Render API — **pending your deploy**

### Phase 8 gate
- [x] Admin can login locally and see seeded taps + simulated data
- [x] Simulated backend data visible on all MVP pages
- [ ] Deployed app gate — after Vercel/Render

---

# PHASE 9 — Firmware (Bench Test, Before Plumbing)

**Goal:** ESP proves 3-sensor counting + MQTT without mounting on college pipes yet.  
**Status:** `docs/phase-9-status.md` · **Checklist:** `firmware/BENCH.md` · **Pins:** `firmware/CONNECTIONS.md`

### 9.1 Pin plan
- [x] Assign 3 GPIOs for YF-S201 pulse lines → 27 / 26 / 25
- [x] Document pin map in `firmware/README` + `CONNECTIONS.md`
- [x] Shared 5V/GND plan; keep wires short

### 9.2 Firmware features
- [x] Pulse capture for sensor A/B/C (ISR-safe counting)
- [x] Debounce / noise handling
- [x] Convert pulses → liters using calibration constants (per tap)
- [x] Session idle timeout aligned with backend constant
- [x] WiFi connect + reconnect
- [x] MQTT publish with device_id, tap_id, ts, liters, message_id
- [x] Watchdog / stable loop basics
- [x] Serial debug output for bench (`sim` / `status` / `pins`)

### 9.3 Bench verification
- [ ] Blow/spin or water-jug test each sensor separately *(or Serial `sim a|b|c`)*
- [ ] Confirm correct tap_id mapping (no crossed A/B/C)
- [ ] Messages appear in backend + dashboard within seconds
- [ ] Kill WiFi briefly → reconnect recovers
- [ ] Leave running 1–2 hours without crash

### Phase 9 gate
- [ ] All 3 sensors independently visible on admin Overview
- [ ] No cross-wiring of tap IDs

*(9.1–9.2 done in repo. 9.3 + gate = your physical/serial bench.)*

---

# PHASE 10 — Field Install & Calibration

**Goal:** Live on real taps, sealed, accurate enough for behavior/pilot science.  
**Runbook:** `docs/phase-10-field-install.md` · **Sheet:** `docs/phase-10-calibration-sheet.md` · **Status:** `docs/phase-10-status.md`

### 10.1 Pre-install
- [ ] Schedule water shutoff window with facilities
- [ ] Bring PTFE, fittings, towels, enclosure, spare wires
- [ ] Confirm approval doc on hand

### 10.2 Mechanical install
- [ ] Install YF-S201 inline on Tap A, B, C (flow arrow correct)
- [ ] No active leaks after repressurizing
- [ ] Mount ESP in IP enclosure, splash-safe, out of easy tamper reach
- [ ] Strain-relief wires; short runs

### 10.3 Power & network
- [ ] Stable 5V power
- [ ] WiFi connected at install site
- [ ] If WiFi fails: document fallback plan before leaving site

### 10.4 Calibration (bucket test)
- [ ] Measure known volume per tap (e.g. 1–5 L)
- [ ] Compute pulses-per-liter per sensor
- [x] Update device/tap calibration in backend — **API + UI + `scripts.set_calibration` ready**
- [ ] Re-test one known volume; error acceptable (~±10% OK for MVP)

### 10.5 Field verification
- [ ] Open each tap briefly → correct tap updates on dashboard
- [ ] Control Tap A flagged in UI
- [ ] Last-seen fresh
- [ ] Photo after-install for records

### Phase 10 gate
- [ ] 24 hours continuous field run with no leak and continuous logging

*(Repo tooling for 10.4 done. 10.1–10.5 + gate = on-site work.)*

---

# PHASE 11 — Phase 0 Baseline Run (Silent Logging)

**Goal:** Real baseline dataset. **No displays / no behavior UI changes for users yet.**  
**Protocol:** `docs/phase-11-baseline-protocol.md` · **Status:** `docs/phase-11-status.md`

### 11.1 Run protocol
- [ ] Confirm displays remain off / not installed (silent)
- [ ] Log **10–14 days** including weekdays + at least one weekend
- [ ] Do not change tap assignment mid-run
- [ ] Do not alter firmware constants mid-run except emergency fixes (document if you do)

### 11.2 Daily ops checks (quick)
- [ ] Day 1: all 3 taps reporting
- [ ] Mid-run: spot-check leaks, enclosure dryness, online status
- [ ] End: export or confirm data completeness — use `docs/phase-11-daily-ops-log.md`

### 11.3 Metrics to compute (from dashboard or export)
- [x] Tooling ready: `scripts.baseline_report` + `GET /api/v1/reports/baseline`
- [ ] Liters/day per tap
- [ ] Average session volume per tap
- [ ] Peak hours
- [ ] Long-tail share (% volume or sessions abnormally long)
- [ ] Control vs intervention raw comparison (descriptive only)

### 11.4 Science gate (from master product doc)
- [ ] Decide if long-tail waste is real enough to justify continuing (target example: material long-tail, e.g. >15% if that threshold fits your data)
- [ ] Write short baseline note (`docs/phase-11-baseline-note-template.md`)

### Phase 11 gate
- [ ] ≥10 days clean data retained
- [ ] Baseline note written
- [ ] Go / no-go decision recorded for adding visibility (Phase 1)

*(Repo protocol + report tooling done. 11.1–11.4 execution happens after field install.)*

---

# PHASE 12 — MVP Closeout & Phase 1 Readiness

**Goal:** Officially close MVP; optionally enable live liter visibility on intervention taps only.  
**Closeout:** `docs/phase-12-mvp-closeout.md` · **Software done:** `docs/MVP-COMPLETE.md` · **Status:** `docs/phase-12-status.md`

### 12.1 MVP acceptance checklist (must all pass)
- [x] Repo: stable tap_ids, ingest, admin UI, control flag, Glacier Ops, no person tracking, cal + baseline tools  
- [ ] Field: written facilities sign-off on file  
- [ ] Field: 3 sensors installed, no active leaks  
- [ ] Field: WiFi OK or fallback documented  
- [ ] Field: Calibration done (record in `mvp-deliverables/calibration-record.md`)  
- [ ] Field: Phase 0 baseline collected (Phase 11 done)  
- [ ] Optional: Admin login on **deployed** frontend (Vercel/Render)

### 12.2 Deliverables package
- [x] Working 3-tap pipeline code + admin UI  
- [x] Seeded hierarchy matching college conventions  
- [x] Baseline tooling + note template (fill after run)  
- [x] Pin map + calibration template documented  
- [x] Known issues list  

### 12.3 Phase 1 readiness (optional stretch inside MVP window)
Only if Phase 11 go-decision is **go**:
- [x] Guide + firmware `DISPLAY_ENABLED` (default off) — `docs/phase-12-phase1-readiness.md`  
- [ ] Add live liter display on **Tap B and Tap C only** (hardware)  
- [ ] Tap A remains blank (control)  
- [ ] Confirm dashboard session volumes still match tap display roughly  
- [ ] Plan same-tap / same-weekday comparison vs Phase 0 for report  

### 12.4 Explicitly still NOT started (stop here)
- [x] Confirmed deferred: `docs/mvp-deliverables/deferred-scope.md`

### 12.5 Handoff pointers (after MVP)
- [x] `docs/mvp-deliverables/handoff.md`  
- [x] Backend → `docs/backend-plan.md` from B2  
- [x] Frontend → `docs/frontend-plan.md` from F2  
- [x] Product → `docs/water-tap-project-master-doc.md`  
- [x] Full plan → `docs/full-master-execution-plan.md`  

### Phase 12 gate — MVP COMPLETE
- [x] **Software** MVP closed (2026-10-03)  
- [ ] All **field** 12.1 boxes checked  
- [ ] Deliverables site fields filled  
- [ ] Team agrees: “MVP closed on \<date\>”

---

## Cross-Cutting Rules (Every Phase)

1. **Permission first** — no install without Phase 1 sign-off  
2. **Waterproofing non-negotiable** — electronics in IP box  
3. **Control purity** — never put feedback on Tap A during MVP  
4. **No guilt copy** in firmware display or web UI  
5. **No secrets in git**  
6. **Do not overbuild** — if it’s not in Phases 1–12, it waits  
7. **Honest pilot framing** — N=3 taps is a pilot, not a powered campus study  

---

## Quick Status Board (Update As You Go)

| Phase | Status (Not started / In progress / Done) | Owner | Date done |
|---|---|---|---|
| 1 Permissions & site | In progress (templates ready) | | |
| 2 Hardware | In progress (BOM ready) | | |
| 3 Repo & env | Done in repo (accounts partial) | | |
| 4 Backend B0 | Done in repo (Mongo/Render pending you) | | |
| 5 Backend auth & seed | Done | | |
| 6 Backend ingest | Done | | |
| 7 Frontend system | Done | | |
| 8 Frontend pages | Done locally (Vercel pending) | | |
| 9 Firmware bench | Firmware ready (bench verify pending you) | | |
| 10 Field install | Runbook ready (site work pending) | | |
| 11 Baseline run | Protocol + report tooling ready | | |
| 12 MVP closeout | Software done (field stamp pending) | | |

---

## Source Documents (Reference Only)

| Doc | Role |
|---|---|
| `docs/water-tap-project-master-doc.md` | Product / behavior authority |
| `docs/mvp-plan.md` | MVP scope summary |
| `docs/frontend-mvp-plan.md` | UI pages & Glacier Ops detail |
| `docs/backend-plan.md` | Full backend map (use B0–B1 only now) |
| `docs/frontend-plan.md` | Full UI map (**after** this plan closes) |

---

*This is the single execution checklist for the TapSense pilot/MVP. Complete Phases 1→12 in order. A full-campus master plan will be written only after Phase 12 is done.*
