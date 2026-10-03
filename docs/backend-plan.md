# TapSense — Complete Backend Plan

**Status:** Full backend architecture (MVP → product)  
**Starts from:** `docs/mvp-plan.md` (must complete MVP slice first)  
**Product authority:** `docs/water-tap-project-master-doc.md`  
**Principle:** Design the hierarchy for organizations / colleges / buildings / societies from day one; implement features in layers so MVP code is not thrown away.

---

## 1. Backend Purpose

Own everything after the ESP publishes data:

- Authenticate devices and admins  
- Ingest, validate, store telemetry  
- Compute sessions and aggregates  
- Serve admin monitoring and (later) public leaderboard / facilities views  
- Support scale from 3 taps → multi-floor → multi-building → multi-org  

Frontend (Next.js) and firmware are consumers of this backend; this document defines **backend structure, modules, services, and rollout** — no code.

---

## 2. Design Principles

1. **Hierarchy first** — every tap belongs under Organization → Campus → Building → Floor → Zone  
2. **Tap-level privacy** — no person IDs; aggregates stop at tap / zone / floor / building  
3. **MVP-compatible** — Phase 0–1 modules are a subset of this plan, not a rewrite  
4. **Idempotent ingest** — duplicate MQTT/HTTP deliveries must not double-count liters  
5. **Control science** — `is_control` taps never get behavioral features mixed into intervention metrics  
6. **Fail soft** — device offline ≠ system crash; stale state is visible to admins  
7. **Feature flags by phase** — visibility, color thresholds, leaderboard, valve, digests can be enabled per org/building  

---

## 3. Target Stack (Backend Side)

| Layer | Choice |
|---|---|
| API framework | FastAPI (Python) |
| Database | MongoDB Atlas |
| Message bus | MQTT (HiveMQ free tier or Mosquitto) |
| Auth | JWT for humans; device API keys / tokens for ESP |
| Hosting | Render (API) |
| Jobs | Scheduled workers / cron endpoints for daily rollups & digests |
| Optional later | Redis (rate limit / live cache), object storage (exports) |

---

## 4. Top-Level Backend Folder Structure (Logical)

Headings only — this is the intended layout of the backend project:

```
backend/
├── app/
│   ├── main                    # App entry, router mount, lifespan
│   ├── core                    # Config, security, constants, logging
│   ├── db                      # Mongo client, indexes, seed helpers
│   ├── models                  # Document shapes / schemas
│   ├── schemas                 # Request/response contracts
│   ├── api/                    # HTTP route modules (versioned)
│   ├── services/               # Business logic
│   ├── mqtt/                   # Broker client, subscribers, publishers
│   ├── workers/                # Cron / background jobs
│   └── utils/                  # Timezones, unit conversion helpers
├── tests/
├── scripts/                    # Seed, migrate, calibrate import
└── docs/                       # API notes, topic map, runbooks
```

---

## 5. Domain Hierarchy Module

### 5.1 Entities
- Organization (college, society, company campus, etc.)
- Campus
- Building
- Floor
- Zone (washroom, canteen, lab sink row)
- Tap
- Device (ESP32; may map 1→1 or 1→many taps in early pilots)

### 5.2 Responsibilities
- CRUD for location tree (admin)
- Soft-delete / archive locations without wiping history
- Resolve “where is this tap” for dashboards and leaderboards
- Scope queries by role (org admin vs building facilities vs read-only)

### 5.3 MVP use of this module
- Seed one path only: Org → Campus → Building → Floor → Zone → 3 Taps  
- Minimal CRUD; full tree UI can wait  

### 5.4 Later expansion
- Multiple buildings / floors  
- Society / residential society orgs  
- Department labels as metadata on Building/Zone (not a separate privacy identity)

---

## 6. Module Catalog (Features Divided Properly)

### Module A — Core / Config
- Environment loading  
- App constants (session idle seconds, timezone, pulses default)  
- Feature flags per organization  
- Structured logging  

### Module B — Security & Auth
- Admin registration invite / bootstrap  
- Login, refresh, logout  
- Role model: `super_admin`, `org_admin`, `facilities`, `viewer`  
- Device credential issue / rotate  
- Rate limiting on login and ingest  

### Module C — Device Registry
- Register ESP devices  
- Bind device ↔ taps  
- Firmware version metadata  
- Last-seen, RSSI optional, online/stale thresholds  
- Calibration factor per tap (pulses-per-liter)  

### Module D — Telemetry Ingest
- MQTT subscriber service  
- Optional HTTP ingest fallback (same payload contract)  
- Payload validation  
- Deduplication keys  
- Write readings  
- Trigger session service  

### Module E — Session Engine
- Detect session start / end  
- Attach liters, duration, tap_id  
- Flag long-tail / unattended-style sessions (threshold config)  
- Never attach user identity  

### Module F — Aggregation
- Daily per-tap totals  
- Weekly rollups  
- Zone / floor / building rollups  
- Control vs intervention split aggregates  
- Leaderboard snapshots (block/floor level)  

### Module G — Thresholds & Behavior Config (Phase 2+)
- Per-tap median / configured threshold  
- Color bands (green / amber / red) as config pushed or mirrored for dashboard  
- Impersonal daily total text config  

### Module H — Leaderboard (Phase 3+)
- Rank floors / zones / buildings by liters (normalized if needed)  
- Weekly winners  
- Public read API (optional, limited fields)  
- Exclude control taps from competitive ranking if desired  

### Module I — Anomaly / Leak (Stretch)
- Odd-hour continuous flow flags  
- Alert records for facilities  
- Not required for MVP  

### Module J — Valve Control (Phase 4 — isolated)
- Command publish to device (close / open)  
- Audit log of commands  
- Separate permission + facilities sign-off flag  
- Fail-closed policy documentation  

### Module K — Notifications
- Telegram weekly digest builder  
- Email optional later  
- Alert hooks for offline devices / leaks  

### Module L — Reporting & Export
- CSV / JSON export for pilot reports  
- Phase comparison helpers (Phase 0 vs 1 vs 2)  
- Control-adjusted views for honest evaluation  

### Module M — Admin API Surface
- All authenticated management endpoints grouped by resource  
- Pagination, filters (date range, building, floor)  

### Module N — Public / Limited API Surface (Later)
- Leaderboard board endpoint  
- Health status for status page  
- No raw per-session dump publicly  

---

## 7. API Route Groups (Logical Headings)

Version everything under `/api/v1`.

### Auth
- Login  
- Refresh  
- Me  

### Organizations & Locations
- Organizations  
- Campuses  
- Buildings  
- Floors  
- Zones  
- Taps  

### Devices
- Register / list / bind taps  
- Rotate credentials  
- Health / last-seen  

### Telemetry (internal / device)
- MQTT is primary  
- HTTP ingest fallback  

### Sessions & Analytics
- List sessions by tap / date  
- Daily aggregates  
- Floor / building summaries  
- Phase comparison summary  

### Leaderboard
- Current week  
- Historical weeks  

### Admin Ops
- Feature flags  
- Thresholds  
- Exports  
- Audit log (later)

### Notifications (later)
- Digest preview / trigger  

---

## 8. MQTT Design (Backend View)

### Topic layout (conceptual)
- `tapsense/{org_id}/devices/{device_id}/telemetry`  
- `tapsense/{org_id}/devices/{device_id}/status`  
- `tapsense/{org_id}/devices/{device_id}/commands` (Phase 4 only)

### Payload concerns (fields, not code)
- device_id  
- tap_id  
- timestamp (UTC)  
- liters_delta or cumulative  
- session_hint (optional)  
- sequence / message_id for dedupe  

### Backend MQTT service duties
- Connect with durable client id  
- Subscribe on boot  
- Validate auth  
- Hand off to ingest service  
- Publish commands only when valve module enabled  

---

## 9. Data Store Plan (Collections / Documents)

Logical collections:

| Collection | Purpose |
|---|---|
| organizations | Top-level tenants |
| campuses | Under org |
| buildings | Under campus |
| floors | Under building |
| zones | Under floor |
| taps | End sensing points + flags |
| devices | ESP registry |
| users | Human accounts + roles |
| readings | Fine-grained telemetry (TTL optional later) |
| sessions | Computed use events |
| daily_aggregates | Fast dashboard queries |
| weekly_leaderboards | Snapshots |
| alerts | Offline / leak / anomaly |
| audit_logs | Sensitive admin / valve actions |
| feature_flags | Per-org phase toggles |
| calibration | Pulses-per-liter history |

**Indexes (intent)**  
- tap_id + timestamp  
- device_id + timestamp  
- org/building/floor scoped queries  
- unique session / message dedupe keys  

**Retention**  
- MVP: keep all  
- Later: downsample readings; keep sessions + daily forever for reports  

---

## 10. Services Layer (What Talks to What)

| Service | Calls / owns |
|---|---|
| AuthService | users, JWT |
| LocationService | hierarchy CRUD |
| TapService | tap config, control flag |
| DeviceService | bind, health |
| IngestService | validate → readings → SessionService |
| SessionService | open/close sessions |
| AggregateService | daily / weekly updates |
| LeaderboardService | rankings from aggregates |
| ThresholdService | Phase 2 configs |
| AlertService | offline + anomaly |
| NotificationService | Telegram / email |
| ReportService | exports + phase deltas |
| CommandService | Phase 4 valve (isolated) |

Rule: **routes stay thin; services hold logic.**

---

## 11. Workers / Background Jobs

| Job | When | Purpose |
|---|---|---|
| Daily rollup reconcile | Nightly | Fix any missed on-write aggregates |
| Device stale check | Every few minutes | Mark offline, create alerts |
| Weekly leaderboard snapshot | Weekly | Freeze rankings |
| Weekly digest | Weekly | Telegram / email |
| Retention cleanup | Monthly (later) | Downsample readings |
| Anomaly scan | Hourly (later) | Leak-like patterns |

---

## 12. How MVP Maps Into This Backend (No Rewrite)

| MVP need | Module to implement first |
|---|---|
| Seed college path + 3 taps | Domain Hierarchy (seed only) |
| Device + 3 tap binding | Device Registry |
| MQTT → store liters | Telemetry Ingest |
| Sessions | Session Engine |
| Daily totals | Aggregation (daily only) |
| Admin login + read | Auth + Admin API |
| Online / last-seen | Device Registry health |

**Do not implement yet in MVP slice:** Leaderboard module polish, Anomaly, Valve, Notifications, multi-role complexity beyond one admin, Public API.

---

## 13. Backend Delivery Phases

### Backend Phase B0 — Skeleton
- Project layout  
- Config + Mongo connection  
- Health endpoint  
- Seed script for pilot hierarchy  

### Backend Phase B1 — MVP ingest (aligns with `mvp-plan.md`)
- Device auth  
- MQTT ingest  
- Readings + sessions + daily aggregates  
- Admin auth  
- Read APIs for 3 taps  

### Backend Phase B2 — Pilot analytics
- Phase comparison endpoints  
- Control vs intervention split  
- Export CSV  
- Stale device alerts  

### Backend Phase B3 — Behavior layers support
- Threshold config APIs  
- Leaderboard aggregates + snapshot job  
- Optional public leaderboard read  

### Backend Phase B4 — Facilities product layer
- Multi-building scoping UX APIs  
- Org roles  
- Anomaly / leak flags  
- Telegram digest  
- Cost-savings translation fields  

### Backend Phase B5 — Hard control (optional)
- Valve command service  
- Audit log  
- Extra permission gates  

---

## 14. Frontend Contract (What Backend Must Support)

Backend must stay ahead of UI needs in this order:

1. **Admin monitor** — taps, status, daily liters, sessions  
2. **Pilot report** — phase deltas, control comparison  
3. **Leaderboard board** — floor/zone ranking  
4. **Facilities dashboard** — multi-building, alerts, ₹ savings  
5. **Ops** — device management, calibration, feature flags  

Each UI stage should only require enabling the matching backend phase above.

---

## 15. Multi-Tenant / Broader Org Readiness

Designed for:

- Colleges with many departments/buildings  
- Hostel blocks and academic blocks  
- Societies / residential campuses  
- Future “organization” customers  

**How without overbuilding UI now**
- Every document carries `organization_id`  
- Queries always scoped by org  
- Feature flags per org  
- Roles introduced when second building or second admin appears  

---

## 16. Evaluation Support (Science, Not Just Software)

Backend should make the master-doc methodology easy:

- Tag phases on date ranges per tap/zone  
- Always query control tap separately  
- Prefer same-weekday comparisons in report endpoints  
- Expose: liters/day, avg session volume, long-tail frequency  

---

## 17. Security & Privacy Checklist

- [ ] No personal user identity on water sessions  
- [ ] Device credentials ≠ admin passwords  
- [ ] HTTPS on API  
- [ ] MQTT credentials rotated if leaked  
- [ ] Role-scoped location access  
- [ ] Valve commands audited (if enabled)  
- [ ] Public APIs never expose raw tap-by-tap live stalking beyond intended board  

---

## 18. Testing Plan (Backend)

| Layer | What to verify |
|---|---|
| Unit | Session boundary logic, aggregation math, dedupe |
| Integration | MQTT message → Mongo documents |
| API | Auth guards, scoped queries |
| Load (light) | 3 taps rapid pulses; later dozens of taps |
| Field | Real washroom WiFi + reconnect behavior |

---

## 19. Definition of “Complete Backend” for This Project

Backend is complete for the college pilot product when:

- Hierarchy supports multi-building expansion without schema change  
- Ingest is reliable and idempotent  
- Sessions + daily + floor aggregates exist  
- Admin monitoring works  
- Leaderboard APIs work for Phase 3  
- Exports support an honest pilot report  
- Stretch modules (alerts, digests, valve) are structured even if toggled off  

---

## 20. Working Sequence With MVP File

1. Follow `docs/mvp-plan.md` Steps A–E using **Backend Phases B0–B1** only  
2. Close MVP success criteria  
3. Return here for **B2 → B3** as physical Phase 1–3 features roll out  
4. Add **B4–B5** only after facilities demand or Phase 4 approval  

---

## 21. One-Page Backend Checklist

- [ ] Folder / module structure created  
- [ ] Hierarchy models + seed  
- [ ] Auth (admin)  
- [ ] Device registry  
- [ ] MQTT ingest  
- [ ] Sessions  
- [ ] Daily aggregates  
- [ ] Admin read APIs  
- [ ] Health / stale detection  
- [ ] Exports  
- [ ] Threshold configs  
- [ ] Leaderboard snapshots  
- [ ] Roles / multi-building scope  
- [ ] Notifications  
- [ ] Anomaly alerts  
- [ ] Valve commands (optional)  

---

*MVP stays small. This file is the map so the same backend grows into the full TapSense system without rebuilding from scratch.*
