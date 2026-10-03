# TapSense — Full Project Master Execution Plan

**Status:** FINAL end-to-end execution checklist for the complete TapSense project  
**Use this file** as the single checkpoint list from day one through campus-ready product close  
**Companion (pilot-only zoom-in):** `docs/mvp-master-execution-plan.md` (Phases 1–12 here match that file in spirit; this file continues through Phase 24)  

**Combines and supersedes for execution order:**
- `docs/water-tap-project-master-doc.md` — product & behavior authority  
- `docs/mvp-plan.md` — MVP scope  
- `docs/mvp-master-execution-plan.md` — pilot checklist detail  
- `docs/backend-plan.md` — backend modules B0–B5  
- `docs/frontend-mvp-plan.md` + `docs/frontend-plan.md` — UI F0–F6  
- Hardware decisions: no bulk meter · pilot 1 ESP×3 taps · later 1 ESP/tap · no PCB until scale manufacturing  

**How to use:** Complete phases in order. Honor every **gate**. Do not start a later behavior layer until the prior science gate passes. Checkboxes are the definition of done.

---

## Locked Product Decisions (Entire Project)

| Topic | Decision |
|---|---|
| Problem | Behavioral gap at the tap — not awareness posters |
| Levers | Real-time visibility + loss-aversion color + social norms — **no guilt text** |
| Privacy | Tap / zone / floor / building only — **never person IDs** |
| Bulk meter | **Not required** |
| Pilot hardware | **1 ESP32 + 3× YF-S201**, Tap A control, B/C intervention |
| Scale hardware | Prefer **1 ESP per tap** when leaving single washroom |
| PCB | **Not for pilot**; reconsider only at multi-building manufacturing |
| Stack | ESP32 · MQTT · FastAPI · MongoDB Atlas · Next.js · Telegram (later) |
| Design | **Glacier Ops** — one identity forever |
| Behavior rollout | Product Phase 0 → 1 → 2 → 3 → optional 4 (valve) |
| Out of v1 forever | App gamification first, water-quality sensing, electricity in same v1 |

### System flow (unchanged for life of project)

```
Tap → YF-S201 → ESP32 (liters, sessions, optional display/valve)
  → MQTT → FastAPI → MongoDB
  → Next.js (admin / facilities / leaderboard) + optional Telegram
```

---

## Full Phase Map (24 Phases)

| # | Phase | Stage |
|---|---|---|
| 1 | Permissions, sites & science design lock | Foundation |
| 2 | Hardware procurement (Wave 1 + plan Wave 2) | Foundation |
| 3 | Repo, accounts & platform conventions | Foundation |
| 4 | Backend B0 — skeleton | Build MVP |
| 5 | Backend B1 — hierarchy, seed, admin auth | Build MVP |
| 6 | Backend B1 — ingest, sessions, aggregates | Build MVP |
| 7 | Frontend F0 — Glacier Ops + shell | Build MVP |
| 8 | Frontend F1 — MVP monitoring pages | Build MVP |
| 9 | Firmware Wave 1 — bench (3 sensors / 1 ESP) | Build MVP |
| 10 | Field install Wave 1 + calibration | Build MVP |
| 11 | Product Phase 0 — silent baseline run | Pilot science |
| 12 | MVP official closeout | Pilot science |
| 13 | Product Phase 1 — visibility (displays + compare start) | Behavior |
| 14 | Backend B2 — pilot analytics & exports | Behavior |
| 15 | Frontend F2 — phases, compare, control, reports UI | Behavior |
| 16 | Product Phase 2 — loss-aversion color thresholds | Behavior |
| 17 | Backend B3 + Frontend F3 — leaderboard system | Behavior |
| 18 | Product Phase 3 — social comparison in the field | Behavior |
| 19 | Scale-out Wave 2 — more taps / buildings / 1 ESP per tap | Scale |
| 20 | Backend B4 + Frontend F4 — facilities product layer | Scale |
| 21 | Notifications, savings narrative, integrations | Scale |
| 22 | Hardening — security, reliability, retention, QA | Harden |
| 23 | Product Phase 4 — auto-cutoff valves (optional / gated) | Stretch |
| 24 | Project close — docs, demo, handoff, publication pack | Close |

---

# PHASE 1 — Permissions, Sites & Science Design Lock

**Goal:** Authority to install; freeze what will be measured before data exists.

### 1.1 Stakeholder pack
- [ ] One-page facilities proposal (measure-first; no valve until Phase 23)
- [ ] Risk note: waterproofing, brief shutoff, no personal tracking
- [ ] Written warden/facilities sign-off stored

### 1.2 Pilot site lock (Wave 1)
- [ ] One washroom, **3 taps**, short cable runs
- [ ] Tap A = **control** (never gets display/color in Phases 13–18)
- [ ] Tap B, C = **intervention**
- [ ] Photos before install; names locked in a sheet

### 1.3 Scale site backlog (plan only — do not install yet)
- [ ] List candidate buildings/floors for Wave 2 (e.g. toward 5–7 taps / second zone)
- [ ] Note which future tap stays control if science expands
- [ ] WiFi/power survey notes per candidate area

### 1.4 Hierarchy naming freeze
- [ ] Organization / Campus / Building / Floor / Zone names finalized for seed

### Phase 1 gate
- [ ] Written approval + Tap A/B/C locked

---

# PHASE 2 — Hardware Procurement

**Goal:** Wave 1 kit in hand; Wave 2 BOM priced and ready to order after MVP.

### 2.1 Wave 1 order (pilot)
- [ ] 1× ESP32 · 3× YF-S201 · IP enclosure · 5V power · wiring · fittings · PTFE
- [ ] Inventory on receipt; ESP USB smoke test

### 2.2 Wave 1 optional (after Phase 11 go)
- [ ] 1–2× WS2812 or OLED for Tap B/C only (do not put on Tap A)

### 2.3 Wave 2 BOM draft (order later)
- [ ] Per additional tap: ESP32 + YF-S201 + enclosure + power + fittings (~₹1,000–1,500)
- [ ] Optional Phase 23 add-on per tap: NC solenoid + relay + 12V supply (~₹450–800)
- [ ] Budget note for 5–7 tap expansion

### Phase 2 gate
- [ ] Wave 1 kit complete

---

# PHASE 3 — Repo, Accounts & Platform Conventions

**Goal:** One engineering spine for firmware, API, web.

### 3.1 Structure
- [ ] `backend/` · `frontend/` · `firmware/` · `docs/`
- [ ] Root README links to **this** master plan
- [ ] `.env.example` only — no secrets in git

### 3.2 Cloud accounts
- [ ] MongoDB Atlas · MQTT broker · Render · Vercel
- [ ] Credential store outside repo

### 3.3 Conventions
- [ ] Campus timezone for daily rollups
- [ ] ID scheme: org, taps, device_01…
- [ ] MQTT topic prefix convention
- [ ] Feature-flag names reserved for phases 0–4

### Phase 3 gate
- [ ] Accounts reachable; conventions written

---

# PHASE 4 — Backend B0 Skeleton

**Goal:** API process lives; Mongo connected; health OK.

### 4.1 Layout
- [ ] `main`, `core`, `db`, `models`, `schemas`, `api`, `services`, `mqtt`, `workers`, `utils`, `scripts`, `tests`

### 4.2 Runtime
- [ ] Env loading · logging · `/health` · Mongo ping · CORS for frontend

### 4.3 Deploy
- [ ] Render (or equiv) health public

### Phase 4 gate
- [ ] Local + deployed health green

---

# PHASE 5 — Backend B1 Hierarchy, Seed & Admin Auth

**Goal:** Scalable data model instantiated for the pilot path; admin can authenticate.

### 5.1 Collections
- [ ] organizations, campuses, buildings, floors, zones, taps, devices, users
- [ ] readings, sessions, daily_aggregates (empty OK)
- [ ] Indexes: tap_id+ts, device_id+ts

### 5.2 Seed
- [ ] Full path to washroom + Tap A/B/C (`is_control` on A)
- [ ] Device bound to three taps
- [ ] Placeholder calibration + first admin

### 5.3 Auth
- [ ] Login · JWT · `/me` · protected routes
- [ ] Role field present (even if only admin used now)

### 5.4 Read APIs
- [ ] Taps list/detail · sessions · daily aggregates · device last-seen

### Phase 5 gate
- [ ] Seed + admin login via API works

---

# PHASE 6 — Backend B1 Ingest, Sessions, Aggregates

**Goal:** Telemetry path trustworthy before hardware depends on it.

### 6.1 Device auth
- [ ] Device token for `device_01`; reject invalid

### 6.2 MQTT + HTTP fallback ingest
- [ ] Subscribe/publish path · validate payload · dedupe message_id

### 6.3 Session engine
- [ ] Start/stop on idle timeout · liters/duration · long-tail flag config

### 6.4 Aggregates + health
- [ ] Daily per-tap totals · last-seen · stale threshold constant

### 6.5 Prove without ESP
- [ ] Simulated A/B/C messages → Mongo → read APIs
- [ ] Replay does not double-count

### Phase 6 gate
- [ ] Simulated E2E ingest trusted

---

# PHASE 7 — Frontend F0 Design System + Shell

**Goal:** Glacier Ops identity and scalable chrome.

### 7.1 Foundations
- [ ] Next.js + Tailwind · Outfit + Sora + mono · Lucide

### 7.2 Tokens & components
- [ ] Glacier Ops color/type tokens
- [ ] Button, input, badge, KPI, table, empty, skeleton, toast, nav item
- [ ] Atmosphere bg (no purple / no cream-terracotta default)

### 7.3 Shell
- [ ] Sidebar + topbar + mobile drawer + auth guard
- [ ] MVP nav only: Overview, Taps, Sessions, Device, Settings

### 7.4 Motion (minimum 3)
- [ ] Page enter · online pulse · KPI settle · reduced-motion support

### Phase 7 gate
- [ ] Shell responsive; visual identity locked

---

# PHASE 8 — Frontend F1 MVP Monitoring Pages

**Goal:** Admin can operate the pilot from the browser.

### 8.1 Pages
- [ ] `/login` — brand-forward
- [ ] Overview — KPIs, 3-tap strip, 7d trend, Phase 0 pill, stale banner
- [ ] `/taps` + `/taps/[id]` — list, filters, chart, sessions, control badge
- [ ] `/sessions` — filters + long-tail flag
- [ ] `/device` — ESP health, bindings (no commands)
- [ ] Settings — logout/profile only

### 8.2 Quality
- [ ] Skeletons · errors · honest empties · no fake prod numbers · privacy copy
- [ ] Deployed on Vercel against live API

### Phase 8 gate
- [ ] Deployed UI shows seeded/simulated data correctly

---

# PHASE 9 — Firmware Wave 1 (Bench)

**Goal:** Desk-proof 1 ESP × 3 sensors before plumbing.

### 9.1 Implementation
- [ ] Pin map documented · 3× pulse ISR paths · debounce
- [ ] Pulses→liters · session idle · WiFi reconnect · MQTT payload contract
- [ ] Serial debug · watchdog basics

### 9.2 Bench QA
- [ ] Each sensor maps to correct tap_id
- [ ] Visible on dashboard · WiFi drop recovery · 1–2h soak stable

### Phase 9 gate
- [ ] Bench E2E with real sensors green

---

# PHASE 10 — Field Install Wave 1 + Calibration

**Goal:** Live washroom install, sealed and calibrated.

### 10.1 Install
- [ ] Facilities window · inline sensors A/B/C · no leaks · IP enclosure · short wires · power

### 10.2 Network
- [ ] WiFi OK or documented SD-sync fallback before leaving site

### 10.3 Calibration
- [ ] Bucket test per tap · store pulses/L · verify ~±10% acceptable

### 10.4 Verify
- [ ] Each tap updates correct row · 24h continuous clean run

### Phase 10 gate
- [ ] 24h field stability + no active leaks

---

# PHASE 11 — Product Phase 0 Silent Baseline

**Goal:** Honest pre-intervention dataset.

### 11.1 Protocol
- [ ] No user-facing displays · 10–14 days · weekdays + weekend · no mid-run tap reassignment

### 11.2 Ops
- [ ] Spot-check dryness, online status, data gaps mid-run

### 11.3 Analysis
- [ ] L/day, avg session, peaks, long-tail share, control vs intervention descriptive note

### 11.4 Science gate
- [ ] Record go/no-go for visibility layer (material long-tail waste expected)

### Phase 11 gate
- [ ] ≥10 days retained + written baseline note + go/no-go

---

# PHASE 12 — MVP Official Closeout

**Goal:** Declare pilot MVP complete; freeze v1 monitoring spine.

### 12.1 Acceptance (all required)
- [ ] Sign-off on file · installs sealed · WiFi/fallback OK  
- [ ] Stable tap_ids · readings/sessions/dailies stored  
- [ ] Admin UI live with control badge · calibration done · baseline done  
- [ ] Glacier Ops consistent · no person tracking  

### 12.2 Deliverables
- [ ] Pipeline + hierarchy seed + baseline pack + pin/calibration doc + known issues

### 12.3 Explicit defer list confirmed
- [ ] Color, leaderboard field, valves, multi-building UI, Telegram, marketing — not started unless later phases

### Phase 12 gate
- [ ] Team signs “MVP closed \<date\>”  
- [ ] *Detail mirror:* `docs/mvp-master-execution-plan.md` Phase 12

---

# PHASE 13 — Product Phase 1 Visibility

**Goal:** Isolate effect of **numbers only** on intervention taps.

### 13.1 Hardware
- [ ] Live liter counter on Tap B & C only  
- [ ] Tap A remains sensor-only  

### 13.2 Firmware/UI sync
- [ ] Display liters match backend sessions within tolerance  
- [ ] Overview phase pill → “Phase 1 — Visibility”

### 13.3 Run
- [ ] Collect comparable window (same weekdays vs Phase 0)  
- [ ] Track % change session volume & long-tail frequency  

### 13.4 Gate
- [ ] Even ~5–10% drop (or clear null result) documented before adding color  
- [ ] If null: redesign display before Phase 16

### Phase 13 gate
- [ ] Phase 1 report note written

---

# PHASE 14 — Backend B2 Pilot Analytics & Exports

**Goal:** Science endpoints so reports are not spreadsheet chaos.

### 14.1 Features
- [ ] Phase date-range tags per zone/taps  
- [ ] Phase comparison API (Δ liters, Δ session, Δ long-tail)  
- [ ] Control vs intervention split aggregates  
- [ ] CSV/JSON export  
- [ ] Stale-device alert records (basic)

### 14.2 Jobs
- [ ] Nightly daily-rollup reconcile  
- [ ] Periodic stale check worker

### Phase 14 gate
- [ ] Export + compare endpoints verified on real Phase 0/1 data

---

# PHASE 15 — Frontend F2 Science & Reporting UI

**Goal:** Admins can run the pilot scientifically from the app.

### 15.1 Nav unlock
- [ ] Phases · Compare · Control · Reports (under Behavior / Facilities as planned)

### 15.2 Pages
- [ ] `/app/phases` — timeline 0–3, date ranges  
- [ ] `/app/compare` — phase deltas + “pilot N=” honesty banner  
- [ ] `/app/control` — control vs cohort  
- [ ] `/app/reports` — generate/download packs  

### 15.3 Overview upgrades
- [ ] Phase-aware badges · links into compare  

### Phase 15 gate
- [ ] Non-engineer teammate can produce Phase 0 vs 1 summary from UI

---

# PHASE 16 — Product Phase 2 Loss-Aversion Color

**Goal:** Wordless green→amber→red cue; impersonal totals.

### 16.1 Config (backend Threshold module)
- [ ] Per-tap threshold from Phase 0/1 median (or configured)  
- [ ] Band definitions stored · no guilt strings in config  

### 16.2 Firmware
- [ ] LED (or equivalent) on B/C only · color + brief pulse · no text scold  
- [ ] Optional OLED impersonal daily total  

### 16.3 Frontend
- [ ] `/app/thresholds` editor + preview bands  
- [ ] Tap detail shows threshold overlay on charts  

### 16.4 Run + measure
- [ ] Collect marginal effect vs Phase 1  
- [ ] Document result  

### Phase 16 gate
- [ ] Phase 2 note done; control still un-cued

---

# PHASE 17 — Backend B3 + Frontend F3 Leaderboard System

**Goal:** Social-norm infrastructure ready before public display.

### 17.1 Backend
- [ ] Floor/zone/building weekly aggregates  
- [ ] Leaderboard snapshot job  
- [ ] Public read API (limited fields)  
- [ ] Exclude control from competitive ranking option  

### 17.2 Frontend admin
- [ ] `/app/leaderboard` configure scope/week  
- [ ] `/app/leaderboard/live` internal full-screen preview  

### 17.3 Public board
- [ ] `/leaderboard/public/[boardId]` — large type, auto-refresh, brand persistent, calm rank motion  
- [ ] No shame copy; recognition for lowest use framed positively  

### Phase 17 gate
- [ ] Board renders real weekly ranks in kiosk/TV test

---

# PHASE 18 — Product Phase 3 Social Comparison (Field)

**Goal:** Strongest literature lever live on campus.

### 18.1 Physical + digital
- [ ] Place physical or screen board in common area  
- [ ] Weekly update cadence locked  
- [ ] Light recognition for lowest-consuming block/floor  

### 18.2 Measure
- [ ] Marginal drop vs Phase 2 documented  
- [ ] Three-layer attribution note: visibility → color → social  

### Phase 18 gate
- [ ] Phase 3 field report complete (core behavior pilot scientifically closed)

---

# PHASE 19 — Scale-Out Wave 2 (Multi-Tap / Multi-Location)

**Goal:** Leave 3-tap washroom architecture without breaking schema.

### 19.1 Architecture shift
- [ ] Prefer **1 ESP per tap** for new installs  
- [ ] Device registry supports many devices  
- [ ] Location tree: add floors/buildings/zones as needed  

### 19.2 Hardware Wave 2
- [ ] Order/install additional taps per backlog from Phase 1.3  
- [ ] Keep ≥1 control tap somewhere in study design  
- [ ] Calibrate each new tap · IP boxes · WiFi checks  

### 19.3 Firmware fleet
- [ ] Shared firmware with per-device config (tap_id, wifi, certs)  
- [ ] Version field reported to backend  

### 19.4 Frontend/Backend enablement
- [ ] Location explorer populated  
- [ ] Building/Floor/Zone dashboards usable  
- [ ] Context switcher (campus/building)  

### Phase 19 gate
- [ ] ≥2 zones or ≥2 buildings reporting cleanly OR documented single-building multi-floor expansion done as planned

---

# PHASE 20 — Backend B4 + Frontend F4 Facilities Product Layer

**Goal:** Something facilities would keep after the student project ends.

### 20.1 Backend
- [ ] Org roles: org_admin / facilities / viewer enforced  
- [ ] Multi-building scoped queries  
- [ ] Alert entity for offline + leak-like patterns (basic rules OK)  
- [ ] Feature flags per org  

### 20.2 Frontend
- [ ] `/app/locations` tree  
- [ ] Building/Floor/Zone pages  
- [ ] `/app/devices` fleet + device detail  
- [ ] `/app/alerts` ack/resolve  
- [ ] `/app/settings/members` invites  
- [ ] `/app/settings/organization` + feature flags UI  
- [ ] Role-based nav hiding  

### Phase 20 gate
- [ ] Facilities role can monitor without seeing admin-only controls

---

# PHASE 21 — Notifications, Savings & Integrations

**Goal:** Closing the loop for stakeholders who do not live in the dashboard.

### 21.1 Telegram (or chosen channel)
- [ ] Bot wired · weekly digest job · `/app/notifications` settings + preview  

### 21.2 Savings narrative
- [ ] Baseline vs current liters avoided  
- [ ] ₹ conversion config (tariff input)  
- [ ] `/app/savings` page for admin buy-in  

### 21.3 Integrations panel
- [ ] MQTT status · digest status · export shortcuts  

### Phase 21 gate
- [ ] One real weekly digest received by team/facilities

---

# PHASE 22 — Hardening, Security, Reliability & QA

**Goal:** Production-minded spine before calling the product “complete.”

### 22.1 Security
- [ ] HTTPS everywhere · secret rotation drill · rate limits on login/ingest  
- [ ] Device creds ≠ admin creds · public APIs cannot dump raw stalking-grade feeds  

### 22.2 Reliability
- [ ] MQTT reconnect tested · ingest idempotency re-tested under load of fleet size  
- [ ] Retention policy: downsample readings; keep sessions+dailies  
- [ ] Backup/restore note for Mongo  

### 22.3 Quality
- [ ] Backend unit tests: session boundaries, aggregate math, dedupe  
- [ ] Integration: MQTT→Mongo path  
- [ ] Frontend critical flows smoke-tested (login→overview→tap→export)  
- [ ] Accessibility pass: contrast, keyboard, status not color-only  
- [ ] Reduced-motion verified  

### 22.4 Ops runbook
- [ ] How to add a tap · replace ESP · rotate keys · calibrate · mark control  

### Phase 22 gate
- [ ] Runbook written + critical tests passing + retention enabled

---

# PHASE 23 — Product Phase 4 Auto-Cutoff Valves (Optional / Gated)

**Goal:** Hard backstop only where psychology fails — **separate approval**.

### 23.1 Preconditions (all mandatory)
- [ ] New written facilities sign-off for **controlling** water  
- [ ] Measure actual line pressure; confirm solenoid rating (esp. gravity tanks)  
- [ ] Fail-closed / NC valve policy understood  

### 23.2 Hardware
- [ ] 12V NC solenoid + relay + 12V supply on selected non-control taps only  
- [ ] Motion/unattended rule defined (N seconds continuous)  

### 23.3 Backend B5
- [ ] CommandService via MQTT commands topic  
- [ ] Audit log every command  
- [ ] Extra permission gate  

### 23.4 Frontend F5
- [ ] `/app/valves` · confirm modal + reason · audit view  
- [ ] Hidden unless feature flag on  

### 23.5 Field
- [ ] Controlled test with facilities present  
- [ ] Rollback plan (manual bypass) documented  

### Phase 23 gate
- [ ] Either **completed safely** OR explicitly **deferred forever for this project** with written reason

---

# PHASE 24 — Project Close, Demo & Handoff

**Goal:** Finish the project as a complete, honest, transferable system.

### 24.1 Product completeness checklist
- [ ] Phases 0–3 behavior story complete with data  
- [ ] Admin + facilities UI live on Glacier Ops  
- [ ] Leaderboard shipped (if Phase 18 done)  
- [ ] Scale path proven or clearly documented  
- [ ] Phase 4 done or deferred  

### 24.2 Documentation pack
- [ ] Architecture one-pager  
- [ ] API/MQTT contract summary  
- [ ] Install & calibration guide  
- [ ] Facilities handoff guide  
- [ ] Pilot results report (control-aware, N honest)  

### 24.3 Demo assets
- [ ] Live dashboard walkthrough script  
- [ ] Optional marketing landing (F6) **only if needed** for SIH/stakeholders — brand-first hero rules  
- [ ] Photo/video of tap unit + board  

### 24.4 Future backlog (explicitly not blocking close)
- [ ] Campus-wide rollout  
- [ ] PCB manufacturing  
- [ ] Multi-org SaaS polish  
- [ ] Electricity/LPG v2 pattern  
- [ ] App gamification  

### 24.5 Final sign-off
- [ ] Team checklist review against this entire file  
- [ ] Facilities acceptance (keep running / pause) recorded  
- [ ] Declare **PROJECT COMPLETE \<date\>**

### Phase 24 gate
- [ ] All 24.1–24.5 required items checked

---

## Cross-Cutting Rules (All 24 Phases)

1. Permission before install; **extra** permission before valves  
2. IP enclosure always — splash kills ESP32s  
3. Control tap never receives intervention UX  
4. No guilt/shame copy in firmware or UI  
5. No personal identity on water data  
6. Schema stays hierarchical (org→…→tap) from Phase 5 onward  
7. One design system: Glacier Ops  
8. Do not skip science gates between product Phases 0→1→2→3  
9. Prefer absence of unfinished nav over greyed “coming soon” clutter  
10. Pilot honesty: small N, control-aware claims only  

---

## Global Status Board

| Phase | Status | Owner | Date done |
|---|---|---|---|
| 1 Permissions & design lock | | | |
| 2 Hardware procurement | | | |
| 3 Repo & platform | | | |
| 4 Backend B0 | | | |
| 5 Backend seed & auth | | | |
| 6 Backend ingest | | | |
| 7 Frontend design system | | | |
| 8 Frontend MVP pages | | | |
| 9 Firmware bench | | | |
| 10 Field install Wave 1 | | | |
| 11 Phase 0 baseline | | | |
| 12 MVP closeout | | | |
| 13 Phase 1 visibility | | | |
| 14 Backend B2 analytics | | | |
| 15 Frontend F2 science | | | |
| 16 Phase 2 color thresholds | | | |
| 17 Leaderboard system | | | |
| 18 Phase 3 field social | | | |
| 19 Scale-out Wave 2 | | | |
| 20 Facilities product layer | | | |
| 21 Digests & savings | | | |
| 22 Hardening & QA | | | |
| 23 Phase 4 valves (opt.) | | | |
| 24 Project close & handoff | | | |

---

## Document Map

| Document | When to open |
|---|---|
| **This file** | Daily execution & checkpoints |
| `mvp-master-execution-plan.md` | Extra detail while inside Phases 1–12 |
| `water-tap-project-master-doc.md` | Why / behavior science disputes |
| `backend-plan.md` | Module/API structure detail |
| `frontend-mvp-plan.md` / `frontend-plan.md` | Page & visual detail |
| `mvp-plan.md` | Short MVP scope reminder |

---

*TapSense is complete when Phase 24 is checked — with Phases 0–3 proven in data, a professional Glacier Ops web system, scalable backend hierarchy, and Phase 4 either safely shipped or explicitly deferred.*
