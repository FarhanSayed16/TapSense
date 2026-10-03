# TapSense — Complete Frontend Plan

**Status:** Full product UI architecture (MVP → campus / org scale)  
**Starts from:** `docs/frontend-mvp-plan.md` (ship this first; do not redesign)  
**Consumes:** `docs/backend-plan.md` APIs (B1 → B5)  
**Product authority:** `docs/water-tap-project-master-doc.md`  
**Principle:** One professional design system (**Glacier Ops**), progressive page unlock by phase, hierarchy that scales from 3 taps to multi-building / multi-org without a rewrite.

---

## 1. Frontend Product Vision

TapSense web is not a toy dashboard. It is a **professional water-operations and behavior platform** with three audiences over time:

| Audience | Need |
|---|---|
| Project / admin team | Pilot science, device health, phase comparisons |
| Facilities / management | Building-wide monitoring, alerts, savings narrative |
| Campus community (limited) | Block/floor leaderboard — social norm, not shame |

The UI must feel **calm, precise, and institutional-grade**: clear data, strong brand, purposeful motion, scalable navigation.

---

## 2. How This Continues From MVP

| MVP already has | Full plan adds |
|---|---|
| Login, shell, overview, taps, sessions, device | Full location explorer |
| 3-tap floor view | Multi-building / campus switcher |
| Phase 0 badge | Phase controls & comparison views |
| Basic charts | Leaderboard, alerts, reports, settings suite |
| Glacier Ops tokens | Extended components + marketing surface |

**Rule:** New pages mount into the **same shell**. No second theme, no throwaway MVP styling.

---

## 3. Complete Sitemap (All Pages)

### 3.1 Public / unauthenticated
| Route | Page | Purpose |
|---|---|---|
| `/` | Marketing landing (optional late) | Brand + product story + CTA to login / demo |
| `/login` | Login | Admin & facilities access |
| `/leaderboard/public/[boardId]` | Public board | Wall display / shared link (read-only) |
| `/status` | System status (optional) | API/MQTT health blurb |

### 3.2 Authenticated — Operations
| Route | Page | Purpose |
|---|---|---|
| `/app` | Overview | Org- or building-scoped command glance |
| `/app/locations` | Location explorer | Campus → building → floor → zone tree |
| `/app/buildings/[id]` | Building dashboard | Building totals, floors, alerts |
| `/app/floors/[id]` | Floor dashboard | Floor taps + comparison |
| `/app/zones/[id]` | Zone dashboard | Washroom / canteen focus |
| `/app/taps` | All taps | Filterable registry |
| `/app/taps/[tapId]` | Tap detail | Full analytics + sessions |
| `/app/sessions` | Sessions explorer | Cross-location session search |
| `/app/devices` | Devices | All ESPs, bindings, health |
| `/app/devices/[deviceId]` | Device detail | Bound taps, last-seen, metadata |

### 3.3 Authenticated — Behavior & Pilot Science
| Route | Page | Purpose |
|---|---|---|
| `/app/phases` | Phase timeline | Phase 0–3 date ranges & status |
| `/app/compare` | Phase comparison | Same-tap / same-weekday deltas |
| `/app/control` | Control analysis | Control vs intervention honesty view |
| `/app/thresholds` | Thresholds | Per-tap median / color bands (Phase 2) |
| `/app/leaderboard` | Leaderboard admin | Configure + preview weekly board |
| `/app/leaderboard/live` | Live board (internal) | Full-screen friendly |

### 3.4 Authenticated — Facilities
| Route | Page | Purpose |
|---|---|---|
| `/app/alerts` | Alerts center | Offline, leak-like, anomaly |
| `/app/savings` | Savings | Liters saved → ₹ narrative |
| `/app/reports` | Reports | Export pilot / weekly packs |
| `/app/notifications` | Notification settings | Telegram digest config |

### 3.5 Authenticated — Administration
| Route | Page | Purpose |
|---|---|---|
| `/app/settings` | Settings hub | Profile, org preferences |
| `/app/settings/organization` | Org profile | Name, timezone, feature flags |
| `/app/settings/members` | Members & roles | Invite admins / facilities / viewers |
| `/app/settings/integrations` | Integrations | MQTT status, Telegram bot link |
| `/app/settings/feature-flags` | Feature flags | Phase modules on/off |
| `/app/audit` | Audit log | Sensitive actions (esp. Phase 4) |

### 3.6 Authenticated — Phase 4 (gated)
| Route | Page | Purpose |
|---|---|---|
| `/app/valves` | Valve inventory | Solenoid-enabled taps |
| `/app/valves/[tapId]` | Valve control | Command + confirm + audit note |

### 3.7 Error & utility
| Route | Page |
|---|---|
| `/403` | Forbidden |
| `/404` | Not found |
| `/app/offline` | Client offline notice |

**MVP subset reminder:** only `/login`, `/app` (overview), taps, sessions, single device — as defined in `frontend-mvp-plan.md`. All other routes arrive by backend phase readiness.

---

## 4. Navigation Architecture (Full Product)

### 4.1 Global shell
- **Left sidebar** (collapsible): primary IA  
- **Top bar:** location context switcher · phase pill · alert bell · user menu  
- **Secondary context bar** (on location pages): breadcrumbs `Org / Campus / Building / Floor / Zone`

### 4.2 Sidebar sections (progressive disclosure)
**Monitor**
- Overview  
- Locations  
- Taps  
- Sessions  
- Devices  

**Behavior** (unlock Phase 1+)
- Phases  
- Compare  
- Thresholds  
- Leaderboard  

**Facilities** (unlock when multi-tap stable)
- Alerts  
- Savings  
- Reports  

**Admin**
- Settings  
- Members  
- Audit (if permitted)  

**Danger zone** (Phase 4 flag)
- Valves  

### 4.3 Context switcher
- Organization (hidden until >1 org)  
- Campus  
- Building  
- Remembers last selection per user  

### 4.4 Public board mode
- Hide sidebar  
- Full-bleed board layout  
- Large type, high contrast, auto-refresh  
- Optional kiosk idle dim  

### 4.5 Role-based nav visibility
| Role | Sees |
|---|---|
| Viewer | Monitor + leaderboard preview |
| Facilities | + Alerts, savings, reports, devices |
| Org admin | + Settings, members, thresholds, phases |
| Super admin | + Feature flags, audit, valves |

---

## 5. Page-by-Page UX Specs (Full Catalog)

### 5.1 Marketing landing (late, optional)
**One composition first viewport:** brand TapSense dominant, one headline, one sentence, one CTA group, one full-bleed atmospheric water/context visual (not inset card collage).  
**Below fold only:** problem → how it works → pilot proof → contact.  
No stats strip in hero. No floating badges on media.

### 5.2 Overview (scaled)
- Scope-aware KPIs (building or campus)  
- Health ribbon: devices online %, taps reporting, open alerts  
- Top wasteful zones (impersonal)  
- Weekly trend  
- Shortcuts into Compare / Alerts  

### 5.3 Location explorer
- Tree + map-optional later  
- Search buildings/floors  
- Click drills into dashboards  
- Install progress indicators during rollout  

### 5.4 Building / Floor / Zone dashboards
Each level: **one primary question** (“How is this building doing this week?”)  
Shared pattern: KPIs → trend → child units table → alerts snippet  

### 5.5 Tap detail (expanded)
MVP detail +  
- Phase markers on chart  
- Threshold band visualization (Phase 2)  
- Long-tail frequency  
- Calibration history  
- “Intervention vs control peer” note when relevant  

### 5.6 Sessions explorer
- Advanced filters: location, duration, liters, long-tail only  
- Bulk export  

### 5.7 Devices
- Fleet table  
- Firmware column  
- Bind/unbind flows (admin)  
- Stale clustering  

### 5.8 Phases
- Visual timeline Phase 0→3  
- Assign date ranges per zone  
- Gate checklist from master doc (read-only reminders)  

### 5.9 Compare
- Pick phase A vs B  
- Metric cards: Δ session volume, Δ long-tail %, Δ daily liters  
- Honest “pilot N=” disclaimer banner  

### 5.10 Control analysis
- Side-by-side control tap vs cohort  
- Prevents overclaiming in reports  

### 5.11 Thresholds
- Per-tap threshold editor  
- Preview of green/amber/red bands  
- Push/sync status to devices (if applicable)  
- Wordless cue reminder (no guilt copy tools)  

### 5.12 Leaderboard
- Admin: choose scope (floor/block), week, exclude control  
- Preview exact public board  
- Recognition moment (lowest use) — positive framing only  

### 5.13 Live / public board
- Large rank list  
- This week liters (normalized if needed)  
- Auto cycle animation between top ranks  
- Brand persistent, calm motion  

### 5.14 Alerts
- List + severity  
- Ack / resolve  
- Deep link to device or tap  

### 5.15 Savings
- Liters avoided vs baseline  
- ₹ estimate (configurable tariff)  
- Narrative for facilities buy-in  

### 5.16 Reports
- Generate Phase 0 baseline pack  
- Phase comparison PDF/CSV  
- Date range export  

### 5.17 Notifications
- Telegram chat link status  
- Weekly digest toggle + preview  

### 5.18 Settings / members / flags / audit / valves
- Standard admin patterns  
- Valve pages require confirm modal + reason field  

---

## 6. Complete Design System — Glacier Ops (Extended)

### 6.1 Brand posture
- Brand name is a **hero-level signal** on public pages and login  
- In-app: compact wordmark in sidebar, never weaker than page titles on marketing surfaces  
- Voice: factual, calm, non-shaming  

### 6.2 Color system (extended tokens)
Keep MVP tokens; add:

| Token | Use |
|---|---|
| `--bg-elevated` | Nested panels |
| `--brand-soft` | Selected nav / soft chips |
| `--accent-soft` | Live data wash |
| `--chart-1..4` | Series colors (teal family + slate, not rainbow candy) |
| `--leaderboard-gold` | Quiet recognition (muted brass, not neon) |
| `--phase-0..3` | Phase palette (slate → teal steps) |

Semantic LED mapping for Phase 2 UI mirrors hardware: green → amber → red.

### 6.3 Typography scale
- Display XL — landing / public board ranks  
- Title L/M — page titles  
- Body / small — UI  
- Mono — numeric data  

Pairing locked in MVP: **Outfit + Sora + Plex Mono** (or exact chosen equivalents).

### 6.4 Icon system
- Lucide across product  
- Custom simple marks only for brand monogram  
- Alert severities via icon + color, not emoji  

### 6.5 Elevation & surfaces
- Prefer border + soft wash over multi-layer shadows  
- 1 subtle shadow max on floating menus  
- Dashboard “cards” only for interactive KPI / alert / tap units  

### 6.6 Data visualization rules
- Area/bar charts with restrained teal fills  
- Always label units (L, L/day)  
- Control series in steel dashed stroke  
- Empty charts use structured illustration (line tap glyph), not clipart  

### 6.7 Content & microcopy
- “This tap · 340 L today” style impersonal totals  
- No guilt strings (“You wasted…”) anywhere in UI  
- Errors human and recoverable  

---

## 7. Motion & Transition System (Full)

Ship a coherent motion language — purposeful presence, not noise.

### 7.1 Core motions (product-wide)
1. **Route transition** — 180ms fade + 6–10px rise  
2. **Nav active indicator** — sliding pill / bar  
3. **Live pulse** — online / “receiving data”  
4. **Number tween** — KPI updates  
5. **Chart enter** — bars/area reveal  
6. **Board rank shift** — leaderboard position ease when weekly refresh hits  
7. **Alert appear** — gentle slide from top of alerts list  

### 7.2 Interaction feedback
- Button press: 80–100ms scale/opacity  
- Table row hover: background wash only  
- Modal: fade + scale 0.98→1  

### 7.3 Reduced motion
Honor `prefers-reduced-motion`: replace with instant opacity cuts.

### 7.4 Forbidden motion
- Parallax scroll in admin  
- Endless skeleton shimmer on all panels  
- Confetti for leaderboard  
- Glow trails / neon pulses  

---

## 8. Layout Patterns (Reusable)

| Pattern | Used on |
|---|---|
| App shell | All authenticated pages |
| KPI strip | Overview, building, floor, tap |
| Split view (list/detail) | Taps, devices, alerts |
| Timeline | Phases |
| Full-screen board | Public / live leaderboard |
| Settings sections | Admin pages |
| Confirm destructive | Valve close, member remove |

---

## 9. Frontend Feature Modules (Folder Logic)

```
frontend/
├── app/                         # routes (Next.js app router)
├── modules/
│   ├── auth/
│   ├── shell/
│   ├── overview/
│   ├── locations/
│   ├── taps/
│   ├── sessions/
│   ├── devices/
│   ├── phases/
│   ├── compare/
│   ├── thresholds/
│   ├── leaderboard/
│   ├── alerts/
│   ├── savings/
│   ├── reports/
│   ├── notifications/
│   ├── settings/
│   ├── valves/
│   └── marketing/
├── design-system/               # tokens, typography, components
├── lib/                         # api client, hooks, formatters
└── public/                      # brand assets
```

Each module owns: pages/sections, hooks, local components. Shared visuals live in `design-system`.

---

## 10. Scalability Rules

1. **Every view is location-scoped** via context switcher + URL params  
2. **Tables virtualize** when tap counts grow (50+ )  
3. **Charts fetch aggregates**, not raw pulse streams  
4. **Public board** uses limited API, auto-refresh interval configurable  
5. **Feature flags** hide modules until backend phase ready  
6. **i18n-ready copy** structure later (English first)  
7. **Same components** for college or society tenants — only seed data changes  

---

## 11. Frontend Delivery Phases (Map to Backend)

| FE Phase | Pages unlock | Needs backend |
|---|---|---|
| F0 Design foundation | Tokens, shell, components | — |
| F1 MVP monitor | Login, overview, taps, sessions, device | B1 |
| F2 Pilot science | Phases, compare, control, exports UI | B2 |
| F3 Behavior | Thresholds, leaderboard admin + public board | B3 |
| F4 Facilities | Alerts, savings, notifications, multi-building nav | B4 |
| F5 Hard control | Valves + audit | B5 |
| F6 Marketing (optional) | Landing | — |

---

## 12. Accessibility & Quality Bar

- Contrast AA for text / critical status  
- Keyboard reachable nav and tables  
- Focus rings visible (brand-colored, not browser-default ugly only)  
- Status never color-only (dot + label)  
- Chart data available in table alternative  
- Consistent toast for mutations  

---

## 13. Responsive / Display Targets

| Target | Priority |
|---|---|
| Laptop admin (1280+) | Primary |
| Tablet facilities walk | High |
| Phone glance | Medium |
| Wall TV leaderboard (1080p+) | Phase 3 |
| Kiosk public board | Phase 3 |

---

## 14. Empty, Onboarding & Pilot Moments

- First-run: “Connect your ESP” checklist on Overview when no readings  
- Phase 0: banner explaining silent baseline (no displays expected)  
- After Phase 0 gate: CTA to enable visibility features  
- Always show sample-size honesty on Compare / Reports  

---

## 15. Definition of “Complete Frontend” for the Project

Frontend is complete for the college product when:

- [ ] Glacier Ops applied everywhere consistently  
- [ ] MVP monitor pages solid on real data  
- [ ] Location hierarchy navigable for multi-building  
- [ ] Phase comparison + control views support the report  
- [ ] Leaderboard (admin + public/wall) ships  
- [ ] Facilities alerts + savings + export exist  
- [ ] Motion system coherent; reduced-motion respected  
- [ ] Role-based nav works  
- [ ] Valve UI gated and audited (if Phase 4 happens)  
- [ ] No second visual redesign required to scale tenants  

---

## 16. Working Sequence With MVP Frontend File

1. Execute `docs/frontend-mvp-plan.md` fully (F0–F1)  
2. Validate with live 3-tap pilot data  
3. Unlock F2 → F3 as physical phases progress  
4. Add F4 when facilities wants building-wide ops  
5. Add F5 only with valve hardware + permission  
6. Add F6 landing only if needed for demos / SIH / stakeholders  

---

## 17. One-Page Frontend Checklist

**Foundation**
- [ ] Tokens, type, icons, base components  
- [ ] Shell + auth guards  
- [ ] Motion primitives + reduced motion  

**MVP**
- [ ] Login · Overview · Taps · Tap detail · Sessions · Device  

**Scale**
- [ ] Locations · Building/Floor/Zone dashboards  
- [ ] Devices fleet · Alerts · Reports · Savings  

**Behavior**
- [ ] Phases · Compare · Control · Thresholds · Leaderboard  

**Admin**
- [ ] Members · Flags · Integrations · Audit · Valves (gated)  

**Public**
- [ ] Wall board · Optional landing  

---

*MVP defines the first honest monitoring UI. This file is the full map so TapSense can grow into a professional, multi-building product without rebuilding the frontend identity.*
