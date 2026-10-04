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
| 20 | Backend B4 + Frontend F4 — facilities product layer | **Dev done** |
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
- [x] Live liter counter on Tap B & C only — LCD + `/visibility` kiosk (optional OLED later)  
- [x] Tap A remains sensor-only  

### 13.2 Firmware/UI sync
- [x] Display path for B/C only (`PRODUCT_PHASE_DISPLAY`) · admin phase toggle  
- [x] Overview phase pill → “Phase 1 — Visibility” when enabled  

### 13.3 Run
- [ ] Collect comparable window (same weekdays vs Phase 0) — **field later**  
- [ ] Track % change session volume & long-tail frequency — **field later**  

### 13.4 Gate
- [ ] Even ~5–10% drop (or clear null result) documented before adding color  
- [ ] If null: redesign display before Phase 16  

### Phase 13 gate
- [ ] Phase 1 report note written — template: `docs/phase-13-report-template.md`  
- [x] *Dev path:* `docs/phase-13-visibility.md` · `docs/phase-13-status.md`

---

# PHASE 14 — Backend B2 Pilot Analytics & Exports

**Goal:** Science endpoints so reports are not spreadsheet chaos.

### 14.1 Features
- [x] Phase date-range tags per zone/taps  
- [x] Phase comparison API (Δ liters, Δ session, Δ long-tail)  
- [x] Control vs intervention split aggregates  
- [x] CSV/JSON export  
- [x] Stale-device alert records (basic)

### 14.2 Jobs
- [x] Nightly daily-rollup reconcile *(admin endpoint + ~6h worker; cron optional)*  
- [x] Periodic stale check worker

### Phase 14 gate
- [x] *Dev path:* `docs/phase-14-analytics.md` · `docs/phase-14-status.md` · `/reports`  
- [ ] Export + compare verified on real Phase 0/1 field windows *(after field baseline)*

---

# PHASE 15 — Frontend F2 Science & Reporting UI

**Goal:** Admins can run the pilot scientifically from the app.

### 15.1 Nav unlock
- [x] Reports nav entry *(Phase 14 early surface)*  
- [x] Phases · Compare · Control dedicated nav *(Science group)*

### 15.2 Pages
- [x] `/phases` — timeline 0–3, date ranges  
- [x] `/compare` — phase deltas + “pilot N=” honesty banner  
- [x] `/control` — control vs cohort  
- [x] `/reports` — generate/download packs  

### 15.3 Overview upgrades
- [x] Phase-aware badges · links into compare  

### Phase 15 gate
- [x] *Dev path:* `docs/phase-15-science-ui.md` · `docs/phase-15-status.md`  
- [ ] Non-engineer teammate produces Phase 0 vs 1 summary on **real field windows**

---

# PHASE 16 — Product Phase 2 Loss-Aversion Color

**Goal:** Wordless green→amber→red cue; impersonal totals.

### 16.1 Config (backend Threshold module)
- [x] Per-tap threshold from Phase 0/1 median (or configured)  
- [x] Band definitions stored · no guilt strings in config  

### 16.2 Firmware
- [x] LED (or equivalent) on B/C only · color + brief pulse · no text scold *(LCD G/A/R; optional WS2812)*  
- [ ] Optional OLED impersonal daily total *(deferred — LCD/visibility cover totals)*  

### 16.3 Frontend
- [x] `/thresholds` editor + preview bands  
- [x] Tap detail shows threshold overlay on charts  

### 16.4 Run + measure
- [ ] Collect marginal effect vs Phase 1  
- [ ] Document result  

### Phase 16 gate
- [x] *Dev path:* `docs/phase-16-color.md` · `docs/phase-16-status.md` · report template  
- [ ] Phase 2 field note done; control still un-cued

---

# PHASE 17 — Backend B3 + Frontend F3 Leaderboard System

**Goal:** Social-norm infrastructure ready before public display.

### 17.1 Backend
- [x] Floor/zone/building weekly aggregates  
- [x] Leaderboard snapshot job  
- [x] Public read API (limited fields)  
- [x] Exclude control from competitive ranking option  

### 17.2 Frontend admin
- [x] `/leaderboard` configure scope/week  
- [x] `/leaderboard/live` internal full-screen preview  

### 17.3 Public board
- [x] `/leaderboard/public/[boardId]` — large type, auto-refresh, brand persistent, calm rank motion  
- [x] No shame copy; recognition for lowest use framed positively  

### Phase 17 gate
- [x] *Dev path:* `docs/phase-17-leaderboard.md` · `docs/phase-17-status.md`  
- [ ] Board renders real weekly ranks in kiosk/TV test *(open public URL on TV)*

---

# PHASE 18 — Product Phase 3 Social Comparison (Field)

**Goal:** Strongest literature lever live on campus.

### 18.1 Physical + digital
- [ ] Place physical or screen board in common area *(field)*  
- [x] Weekly update cadence locked *(dev: `/social` lock + API)*  
- [x] Light recognition for lowest-consuming block/floor *(board + recognition label)*  

### 18.2 Measure
- [ ] Marginal drop vs Phase 2 documented  
- [x] Three-layer attribution note helper *(API + `/social`; fill after field windows)*  

### Phase 18 gate
- [x] *Dev path:* `docs/phase-18-social.md` · `docs/phase-18-status.md` · report template  
- [ ] Phase 3 field report complete (core behavior pilot scientifically closed)

---

# PHASE 19 — Scale-Out Wave 2 (Multi-Tap / Multi-Location)

**Goal:** Leave 3-tap washroom architecture without breaking schema.

### 19.1 Architecture shift
- [x] Prefer **1 ESP per tap** for new installs  
- [x] Device registry supports many devices  
- [x] Location tree: add floors/buildings/zones as needed  

### 19.2 Hardware Wave 2
- [ ] Order/install additional taps per backlog from Phase 1.3  
- [x] Keep ≥1 control tap somewhere in study design *(tap_a remains control)*  
- [ ] Calibrate each new tap · IP boxes · WiFi checks  

### 19.3 Firmware fleet
- [x] Shared firmware with per-device config (tap_id, wifi, certs)  
- [x] Version field reported to backend  

### 19.4 Frontend/Backend enablement
- [x] Location explorer populated  
- [x] Building/Floor/Zone dashboards usable  
- [x] Context switcher (campus/building)  

### Phase 19 gate
- [x] *Dev path:* `docs/phase-19-scale.md` · `seed_wave2` multi-floor/zones · `/locations` `/devices`  
- [ ] ≥2 zones or ≥2 buildings reporting cleanly in the **field** OR documented expansion after hardware install

---

# PHASE 20 — Backend B4 + Frontend F4 Facilities Product Layer

**Goal:** Something facilities would keep after the student project ends.

### 20.1 Backend
- [x] Org roles: org_admin / facilities / viewer enforced  
- [x] Multi-building scoped queries  
- [x] Alert entity for offline + leak-like patterns (basic rules OK)  
- [x] Feature flags per org  

### 20.2 Frontend
- [x] `/app/locations` tree  
- [x] Building/Floor/Zone pages  
- [x] `/app/devices` fleet + device detail  
- [x] `/app/alerts` ack/resolve  
- [x] `/app/settings/members` invites  
- [x] `/app/settings/organization` + feature flags UI  
- [x] Role-based nav hiding  

### Phase 20 gate
- [x] Facilities role can monitor without seeing admin-only controls (dev verified via caps + nav)

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

**Updated:** 2026-10-04 · Software spine through pilot is largely built; field science gates (calibration, ≥10-day baseline, formal MVP stamp) remain open and can run in parallel with post-MVP **development**.

| Phase | Status | Notes |
|---|---|---|
| 1 Permissions & design lock | **Partial** | Site/taps locked in repo docs; written facilities sign-off may still be pending |
| 2 Hardware procurement | **Done (Wave 1)** | ESP + 3× YF-S201 + LCD + power on bench/board |
| 3 Repo & platform | **Done** | Monorepo, Atlas, Upstash, conventions |
| 4 Backend B0 | **Done** | FastAPI health, Mongo, Redis, CORS (Render deploy optional) |
| 5 Backend seed & auth | **Done** | Hierarchy seed, JWT admin, read APIs |
| 6 Backend ingest | **Done** | MQTT + HTTP, sessions, dailies, dedupe, simulate |
| 7 Frontend design system | **Done** | Glacier Ops shell |
| 8 Frontend MVP pages | **Done (local)** | Overview/Taps/Sessions/Device/Settings + showcase polish; Vercel optional |
| 9 Firmware bench | **Done** | Pilot firmware live Wi‑Fi → dashboard; LCD status |
| 10 Field install Wave 1 | **Partial / defer cal** | Live path works; **bucket calibration + 24h sealed field gate later** |
| 11 Phase 0 baseline | **Not started (field)** | Protocol/tools ready; **≥10-day silent run later** |
| 12 MVP closeout | **Software-ready / stamp open** | Closeout docs exist; formal “MVP closed” after 10–11 field |
| 13 Phase 1 visibility | **Dev done / field later** | API phase toggle, `/visibility`, LCD B/C only; science report after baseline |
| 14 Backend B2 analytics | **Dev done / field verify later** | Phase windows, compare, control split, CSV/JSON, stale alerts, reconcile; `/reports` |
| 15 Frontend F2 science | **Dev done / field verify later** | Science nav + `/phases` `/compare` `/control` `/reports`; Overview links |
| 16 Phase 2 color thresholds | **Dev done / field later** | Thresholds API/UI, visibility bands, firmware G/A/R + optional WS2812 |
| 17 Leaderboard system | **Dev done / kiosk test open** | Weekly aggregates, snapshots, admin + public board |
| 18 Phase 3 field social | **Dev done / field later** | `/social` cadence lock, Phase 3 toggle, attribution helper, P3 firmware status |
| 19 Scale-out Wave 2 | **Dev done / field hardware later** | Location tree, fleet registry, single-tap firmware, seed_wave2 |
| 20 Facilities product layer | **Dev done / field ops later** | Roles, scoped queries, alerts ack/resolve, feature flags, members/org UI |
| 21 Digests & savings | **Queued** | Telegram etc. |
| 22 Hardening & QA | **Queued** | |
| 23 Phase 4 valves (opt.) | **Deferred unless gated** | Extra permission |
| 24 Project close & handoff | **Queued** | |

### Parallel tracks (allowed)

| Track | What |
|---|---|
| **A — Development** | Phase 13–20 software done; next is **Phase 21** digests & savings when ready. Do **not** claim Phase 1–3 science results until real field windows exist. |
| **B — Field (later)** | Calibration (10) → silent baseline (11) → sign MVP closeout (12). |

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
