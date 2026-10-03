# TapSense — Frontend MVP Plan

**Status:** Active plan for the first usable web UI  
**Audience:** Admin / project team / facilities viewer (not public students yet)  
**Stack:** Next.js + Tailwind + (light motion library, e.g. Framer Motion or CSS transitions)  
**Aligns with:** `docs/mvp-plan.md`, `docs/backend-plan.md` (B0–B1 APIs)  
**Continues into:** `docs/frontend-plan.md` (full product UI)

---

## 1. MVP Frontend Goal

Deliver a **professional admin monitoring app** that proves:

1. Admin can sign in  
2. See 3 pilot taps on one floor  
3. See live / recent liters, sessions, daily totals  
4. See device online / stale status  
5. Distinguish the control tap  

UI must look intentional and scalable (same shell as the full product), but **only MVP pages ship**. No marketing site, no multi-building explorer, no public leaderboard product yet.

---

## 2. In Scope vs Out of Scope

### In scope (MVP UI)
- Auth (login / logout / session restore)
- App shell (sidebar + top bar) reusable later
- Overview dashboard for the pilot floor (3 taps)
- Tap detail page
- Sessions list (recent)
- Device health strip
- Empty / loading / error states
- Responsive layout (desktop-first, usable on tablet/phone)
- Design tokens, typography, motion baseline

### Out of scope (MVP UI)
- Public marketing / landing page
- Student-facing leaderboard wall
- Multi-org / multi-campus switcher UI
- Building tree browser (full hierarchy)
- Threshold color config screens (Phase 2)
- Facilities alerts center
- Telegram / digest settings
- Valve / command screens (Phase 4)
- Dark-mode theme toggle (defer; one polished light theme first)
- Heavy card grids, emoji decoration, generic “AI purple” look

---

## 3. Information Architecture (MVP)

```
/login
└── (authenticated)
    ├── /                        → Overview (pilot floor)
    ├── /taps                    → Tap list (3 taps)
    ├── /taps/[tapId]            → Tap detail
    ├── /sessions                → Recent sessions (all 3 taps)
    └── /device                  → Single ESP device status
```

Optional soft routes (stub ok, hidden from nav if empty):
- `/settings` → profile + logout only

---

## 4. Page Inventory (MVP)

### 4.1 Login
**Purpose:** Gate the admin app.  
**Elements:**
- Brand wordmark (TapSense) as hero-level signal on this screen
- Short supporting line (“Pilot water monitoring”)
- Email / password fields
- Primary CTA: Sign in
- Error toast / inline error
- Subtle atmospheric background (mist + soft aqua wash) — not a flat white box page

**Motion:** gentle fade-up of form; brand mark soft opacity settle on load.

### 4.2 Overview (Home)
**Purpose:** One-glance health of the pilot.  
**One job:** answer “are the taps logging, and how much water today?”  
**Elements:**
- Floor / zone title (seeded location path as breadcrumb text)
- KPI row: liters today (sum), liters this week, active sessions now, devices online
- Tap status strip (3 units): name, online/stale, today’s liters, control badge
- Mini trend: last 7 days total (simple bar/area)
- Phase badge: “Phase 0 — Baseline” (static for MVP)

**Motion:** KPI numbers count-up once; status dots breathe if online; chart draws left→right.

### 4.3 Taps list
**Purpose:** Compare the 3 taps.  
**Elements:**
- Table or dense list (not flashy card collage): Tap · Zone · Role (control/intervention) · Today L · Week L · Last seen
- Filter chips: All / Control / Intervention (simple)
- Click row → tap detail

### 4.4 Tap detail
**Purpose:** Deep dive one tap.  
**Elements:**
- Header: tap name, control badge, online state
- KPIs: today, week, avg session, long-tail count (if API ready; else hide)
- Usage chart (daily bars for selected range: 7d / 14d)
- Recent sessions table
- Calibration read-only note (pulses/L) if available
- Device link (“Hosted on ESP-01”)

### 4.5 Sessions
**Purpose:** Chronological feed across taps.  
**Elements:**
- Filters: tap, date range
- Columns: start, end, duration, liters, tap, long-tail flag
- Empty state copy for Phase 0 early days

### 4.6 Device
**Purpose:** Hardware health for the single ESP.  
**Elements:**
- Device id, firmware version (if sent), last seen
- Bound taps (A/B/C)
- Stale warning callout if offline beyond threshold
- No command buttons in MVP

---

## 5. Navigation (MVP)

### Sidebar (persistent on desktop)
- Overview  
- Taps  
- Sessions  
- Device  
- (divider)  
- Settings (minimal)

### Top bar
- Current location crumb: `College › Hostel › Floor 1 › Washroom`
- Phase pill
- Admin avatar / initials → logout

### Mobile
- Collapsible drawer same items
- Top bar keeps brand mark + menu

**Rule:** Never show future full-product nav items greyed out in a noisy way. Prefer **absence** until the module exists (cleaner). Optional “Coming later” section only in Settings docs link, not main nav.

---

## 6. Design System Baseline (Shared With Full Frontend)

MVP must lock tokens so full UI continues without a redesign.

### 6.1 Theme name: **Glacier Ops**
Professional utility / water-ops look. Cool, clear, calm. Not consumer-gimmick, not purple SaaS.

### 6.2 Color tokens
| Token | Role | Direction |
|---|---|---|
| `--bg` | Page atmosphere | Cool mist stone `#EEF3F6` with soft teal depth gradient |
| `--surface` | Panels | `#FFFFFF` at ~92–96% for readable work areas |
| `--ink` | Primary text | Deep slate `#12263A` |
| `--muted` | Secondary text | `#5B6B7C` |
| `--brand` | Primary actions / links | Deep teal `#0E7490` |
| `--brand-strong` | Hover / emphasis | `#155E75` |
| `--accent` | Highlights / live indicators | Clear aqua `#2DD4BF` |
| `--line` | Dividers | `#D5DEE7` |
| `--ok` | Online / healthy | `#059669` |
| `--warn` | Stale / amber threshold later | `#D97706` |
| `--danger` | Offline / fault | `#DC2626` |
| `--control` | Control tap badge | Cool steel `#64748B` |

**Avoid:** purple/indigo gradients, warm cream `#F4F1EA` + terracotta, neon glow stacks, pure black walls as default.

### 6.3 Typography
| Role | Direction |
|---|---|
| Display / brand | **Outfit** (or similar geometric sans) — wordmark & major page titles |
| UI / body | **Manrope** alternative prefer **Sora** for UI labels & body |
| Data / numbers | **IBM Plex Mono** or **JetBrains Mono** for liters & timestamps |

Do **not** use Inter, Roboto, Arial, or system-ui as the designed face.

### 6.4 Iconography
- Single set: **Lucide** (consistent stroke)  
- Semantic icons only: tap/droplet, activity, radio, clock, building, layout dashboard  
- No emoji in UI chrome  
- Online = filled soft aqua dot; stale = amber; offline = red  

### 6.5 Layout & density
- Max content width ~1280–1440px for admin  
- 8px spacing grid  
- Sidebar ~240–260px  
- Prefer **lists + KPI strips** over card walls  
- Cards only where they wrap a real interactive unit (KPI click-through, tap status unit)

### 6.6 Atmosphere (not flat)
- App background: soft diagonal mist + very subtle aqua radial near top-left  
- Login: stronger brand atmosphere (still restrained)  
- No full-bleed stock photos in admin MVP  
- Hairline rules and quiet surfaces > heavy shadows  

### 6.7 Motion (MVP minimum — ship 3 intentional motions)
1. **Page enter:** 150–220ms fade + 8px rise  
2. **Live status:** soft pulse on online indicator  
3. **Metric settle:** count-up or fade-in for KPI numbers on first paint  

Optional fourth: chart stroke/bar grow.  
**No:** bouncing loaders, confetti, parallax noise, endless shimmer everywhere.

### 6.8 Components to standardize early
- Button (primary / ghost / danger)  
- Input / label  
- Badge (control, phase, status)  
- KPI stat  
- Data table  
- Empty state  
- Skeleton loader  
- Toast  
- Sidebar nav item  

---

## 7. States & UX Rules (MVP)

| State | Behavior |
|---|---|
| Loading | Skeletons matching layout, not spinners-only |
| Empty (no data yet) | Calm copy: “Waiting for first pulses from the washroom ESP” |
| Error | Inline + retry; never blank crash |
| Stale device | Amber banner on Overview + Device |
| Control tap | Always visually distinct; never mixed into “best performer” language |

**Privacy copy:** nowhere imply personal tracking. Labels are tap / floor / zone only.

---

## 8. Responsiveness

| Breakpoint | Behavior |
|---|---|
| Desktop | Sidebar + multi-column overview |
| Tablet | Collapsible sidebar; tables horizontally scroll if needed |
| Phone | Drawer nav; stacked KPIs; charts full width |

Touch targets ≥ 44px on primary controls.

---

## 9. Frontend Module Map (MVP)

- `auth` — login, session, route guards  
- `shell` — sidebar, topbar, crumbs  
- `overview` — home KPIs + tap strip  
- `taps` — list + detail  
- `sessions` — feed  
- `device` — ESP health  
- `ui` — design system primitives  
- `lib/api` — typed client for B1 endpoints  
- `lib/format` — liters, duration, relative time  

---

## 10. API Dependencies (Must Exist From Backend B1)

- Login / me  
- List taps (3) + flags  
- Tap detail aggregates  
- Sessions list  
- Device last-seen  
- Daily aggregates for charts  

If an API is late: show structured empty states, do not fake demo numbers in production mode.

---

## 11. MVP Frontend Success Criteria

- [ ] Login works against real auth  
- [ ] Overview shows real liters for 3 taps (or honest empty)  
- [ ] Control tap visibly marked  
- [ ] Tap detail chart + sessions work  
- [ ] Online/stale reflects last-seen  
- [ ] Glacier Ops tokens applied consistently  
- [ ] Three baseline motions present  
- [ ] Mobile usable for a facilities walkthrough  
- [ ] Same app shell can add pages later without redesign  

---

## 12. Build Order (Frontend MVP)

1. Design tokens + typography + base components  
2. Shell + routing guards  
3. Login  
4. Overview wired to APIs  
5. Taps list + detail  
6. Sessions  
7. Device  
8. Empty/error polish + motion pass  

---

## 13. Handoff Into Full Frontend

When MVP criteria pass, continue in `docs/frontend-plan.md` for:

- Public / wall leaderboard  
- Multi-building navigation  
- Phase 2–3 behavior screens  
- Facilities command center  
- Marketing landing (optional)  
- Expanded motion + illustration system  

**Do not** invent a second visual identity. Full plan extends **Glacier Ops**.

---

*This file defines the first shippable TapSense web UI. Full page catalog and scale-up live in `docs/frontend-plan.md`.*
