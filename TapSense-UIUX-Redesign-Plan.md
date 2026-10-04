# TapSense — Complete UI/UX Redesign Plan

**Document type:** End-to-end UI/UX overhaul specification  
**Created:** October 4, 2026  
**Target audience:** Development team, professor review  
**Scope:** Every screen in the current Glacier Ops admin dashboard  
**Principle:** Transform a generic, AI-template dashboard into a **purpose-built water-operations platform** that professors and facilities staff immediately recognize as professional, intentional, and domain-specific.

---

## Table of Contents

1. [Current State Audit — What's Wrong](#1-current-state-audit--whats-wrong)
2. [Design Philosophy — The New Direction](#2-design-philosophy--the-new-direction)
3. [Color System Overhaul](#3-color-system-overhaul)
4. [Typography Refinement](#4-typography-refinement)
5. [Iconography & Visual Language](#5-iconography--visual-language)
6. [Layout & Spacing System](#6-layout--spacing-system)
7. [Component-Level Redesign](#7-component-level-redesign)
8. [Screen-by-Screen Redesign Specification](#8-screen-by-screen-redesign-specification)
9. [Motion & Interaction Design](#9-motion--interaction-design)
10. [Data Visualization Strategy](#10-data-visualization-strategy)
11. [Responsive & Accessibility](#11-responsive--accessibility)
12. [Implementation Priority & Phasing](#12-implementation-priority--phasing)

---

## 1. Current State Audit — What's Wrong

### 1.1 Visual Evidence (Current Screenshots)

````carousel
![Overview page — empty, flat KPI cards with no visual weight or hierarchy](C:/Users/farha/.gemini/antigravity-ide/brain/308e2652-a14a-406f-a9dc-72a12ba7bcac/1.png)
<!-- slide -->
![Expanded Overview — developer-facing banner noise, badge soup, too many raw technical strings visible](C:/Users/farha/.gemini/antigravity-ide/brain/308e2652-a14a-406f-a9dc-72a12ba7bcac/2.png)
<!-- slide -->
![Taps page — plain HTML table with zero visual distinction between control and intervention](C:/Users/farha/.gemini/antigravity-ide/brain/308e2652-a14a-406f-a9dc-72a12ba7bcac/5.png)
<!-- slide -->
![Sessions page — raw data dump with no visual rhythm or scanability](C:/Users/farha/.gemini/antigravity-ide/brain/308e2652-a14a-406f-a9dc-72a12ba7bcac/6.png)
<!-- slide -->
![Devices page — massive empty void, single device looks lonely and unfinished](C:/Users/farha/.gemini/antigravity-ide/brain/308e2652-a14a-406f-a9dc-72a12ba7bcac/7.png)
<!-- slide -->
![Settings page — feels like a developer config dump, not an admin interface](C:/Users/farha/.gemini/antigravity-ide/brain/308e2652-a14a-406f-a9dc-72a12ba7bcac/18.png)
````

### 1.2 Systematic Problems Identified

| # | Problem | Severity | Where |
|---|---------|----------|-------|
| 1 | **Generic AI-template aesthetic** — flat white cards, thin gray borders, zero personality. Looks identical to every auto-generated dashboard. | 🔴 Critical | Everywhere |
| 2 | **No visual hierarchy** — KPI cards, section headers, tap cards, and tables all have the same visual weight. The eye has nowhere to land first. | 🔴 Critical | Overview, Taps |
| 3 | **Developer-facing noise exposed to users** — raw technical strings like `showcase_scale`, `tap_a`, `multi_tap`, `device_01`, `building_hostel`, and developer banners are displayed prominently. Professors and facilities staff should never see internal IDs. | 🔴 Critical | Overview banner, Locations, Devices |
| 4 | **Badge/pill soup** — too many small pills (`Mongo OK`, `Redis OK`, `Devices OK`, `Phase 0 — Baseline`, `live product phase`, `dates unset`) scattered without grouping. Visually chaotic. | 🟡 High | Overview, Phases, Social |
| 5 | **Empty space mismanagement** — pages like Devices and Alerts are 80% empty white void. No structured empty states, no contextual guidance. | 🟡 High | Devices, Alerts |
| 6 | **Sidebar navigation is bloated** — 15+ items across MONITOR and SCIENCE groups, with no progressive disclosure. A professor seeing "Control", "Thresholds", "Social field" together is overwhelming. | 🟡 High | Sidebar |
| 7 | **Monospace font overuse** — numeric values use monospace `0.00 L` everywhere, even in page headers and card titles. This gives a "terminal output" feel instead of a polished dashboard. | 🟡 High | All pages |
| 8 | **No atmospheric depth** — the background is flat `#EEF3F6` with no gradient, no texture, no layering. Surfaces don't feel elevated. | 🟡 High | Everywhere |
| 9 | **Charts are invisible** — the "Last 7 days" chart area is literally blank/empty with no data visualization, no axis labels, and no placeholder illustration. | 🟡 High | Overview |
| 10 | **Inconsistent button styling** — primary teal buttons, ghost buttons, and outline buttons are mixed without a clear pattern. The "Save bands", "Save tap_b", "Run control vs intervention" buttons all look different. | 🟠 Medium | Thresholds, Control, Leaderboard |
| 11 | **Yellow warning banners overused** — every science page has a yellow `⚠` banner with long text. These blur together and get ignored (banner blindness). | 🟠 Medium | Compare, Control, Thresholds, Reports |
| 12 | **Login page was not captured but likely flat** — based on the overall design language, the login is probably a plain centered form with no brand atmosphere. | 🟠 Medium | Login |
| 13 | **No data storytelling** — numbers are displayed raw without context. "6.22 L" means nothing unless compared to something. No sparklines, no trend arrows, no "vs yesterday" indicators. | 🟠 Medium | Overview, Taps |
| 14 | **Leaderboard public view is underwhelming** — large ranks with plain white cards and a pale yellow header. Doesn't feel celebratory or motivating for a wall display. | 🟠 Medium | Leaderboard |
| 15 | **Top bar is cluttered** — breadcrumb, building switcher dropdown, phase pill, user avatar, and logout button are all crammed together. | 🟠 Medium | Top bar |

---

## 2. Design Philosophy — The New Direction

### 2.1 Core Design Principles

> **The UI should feel like a precision instrument for water operations, not a generic admin panel.**

| Principle | What it means in practice |
|-----------|--------------------------|
| **Domain-specific, not generic** | Every element should feel like it was designed for water monitoring. Use water metaphors in empty states, flow-inspired data vis, ripple motions — but subtly, never cartoonishly. |
| **Data speaks first** | Numbers, charts, and status indicators should dominate the visual hierarchy. Chrome and decoration should retreat. |
| **Calm authority** | The tone is professional-institutional. A facilities manager should trust this dashboard the way they trust a building management system. No playfulness, no emoji, no gimmicks. |
| **Progressive revelation** | Show only what the user needs at each level. Hide complexity behind intentional interactions (hover, click, expand). |
| **Honest about scale** | This is a pilot with 3 taps. Don't make the UI feel cavernous. Design for the current data density first, then scale gracefully. |

### 2.2 Design Inspiration References

The visual direction should draw from:
- **Linear App** — clean density, purposeful use of color, data-forward layout
- **Vercel Dashboard** — professional surface layering, restrained color, strong typography
- **Grafana Cloud** — information density for monitoring dashboards done right
- **Stripe Dashboard** — hierarchical surfaces, excellent empty states

**Not from:** generic SaaS templates, Notion, Figma community AI dashboards, Material UI defaults.

### 2.3 Audience-Specific UX Thinking

| Audience | What they care about | What confuses them now |
|----------|---------------------|----------------------|
| **Professor / evaluator** | Does it look professional? Is the science visible? Can they understand the data story? | Technical IDs, developer banners, raw config exposed |
| **Facilities manager** | Is anything broken? How much water today? Any alerts? | 15 sidebar items, science jargon, phase terminology |
| **Project team (admin)** | All of the above + device health, calibration, phase management | Nothing — they built it. But the UI should still be clean. |

---

## 3. Color System Overhaul

### 3.1 Problem with Current Colors
The current palette is technically defined but **not visually present**. The teal brand color appears only on sidebar text and a few buttons. The overall impression is "gray and white" — undifferentiated and flat.

### 3.2 Proposed New Color System

#### Primary Palette

| Token | Hex | Usage | Visual Effect |
|-------|-----|-------|---------------|
| `--bg-base` | `#F0F4F8` | Main page background | Cooler, slightly blue-shifted neutral — not warm, not dead gray |
| `--bg-subtle` | `#E8EEF4` | Sidebar background, nested panels | Distinguishable from base but not jarring |
| `--surface-primary` | `#FFFFFF` | Cards, panels, modals | Pure white for maximum contrast with data |
| `--surface-elevated` | `#FAFCFE` | Hover states, selected rows | Barely-there tint for interaction feedback |
| `--ink-primary` | `#0F172A` | Headings, primary text | Near-black with blue undertone — warmer than pure black |
| `--ink-secondary` | `#475569` | Labels, secondary text | Legible gray, not washed out |
| `--ink-tertiary` | `#94A3B8` | Placeholders, timestamps | Deliberately quiet |

#### Brand Colors (Water-Inspired Deep Teal)

| Token | Hex | Usage |
|-------|-----|-------|
| `--brand-600` | `#0891B2` | Primary actions, links, active nav |
| `--brand-700` | `#0E7490` | Hover state for primary actions |
| `--brand-800` | `#155E75` | Pressed state, strong emphasis |
| `--brand-100` | `#CFFAFE` | Soft brand fills (selected chips, active nav bg) |
| `--brand-50` | `#ECFEFF` | Lightest brand wash (page section highlight) |

#### Semantic Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `--status-online` | `#10B981` | Device online, healthy, flowing |
| `--status-online-bg` | `#D1FAE5` | Online badge background |
| `--status-warn` | `#F59E0B` | Stale device, approaching threshold |
| `--status-warn-bg` | `#FEF3C7` | Warning badge background |
| `--status-danger` | `#EF4444` | Offline, error, over threshold |
| `--status-danger-bg` | `#FEE2E2` | Danger badge background |
| `--status-info` | `#3B82F6` | Informational callouts |
| `--status-info-bg` | `#DBEAFE` | Info badge background |

#### Data Visualization Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `--chart-primary` | `#0891B2` | Main data series (intervention taps) |
| `--chart-secondary` | `#06B6D4` | Secondary series |
| `--chart-control` | `#64748B` | Control tap (always steel gray, dashed) |
| `--chart-fill` | `rgba(8, 145, 178, 0.12)` | Area chart fills |
| `--chart-grid` | `#E2E8F0` | Grid lines |

#### Threshold Colors (Phase 2 Hardware Mirror)

| Band | Hex | Meaning |
|------|-----|---------|
| `--threshold-green` | `#10B981` | Below median — efficient |
| `--threshold-amber` | `#F59E0B` | Approaching limit |
| `--threshold-red` | `#EF4444` | Over threshold |

### 3.3 Key Color Changes from Current

```diff
- Background:        #EEF3F6 (warm mist)       → #F0F4F8 (cooler, sharper)
- Sidebar bg:        white                      → #E8EEF4 (distinct from content)
- Brand:             #0E7490 (used sparingly)   → #0891B2 (more vibrant, used generously)
- Text primary:      #12263A                    → #0F172A (slightly warmer)
- Cards:             thin 1px border only       → subtle shadow + border (layered feel)
+ NEW: Badge backgrounds (colored fills instead of outline-only pills)
+ NEW: Chart colors defined (currently charts are empty)
+ NEW: Gradient accents on KPI cards (brand-50 → white)
```

---

## 4. Typography Refinement

### 4.1 Current Problems
- Monospace (`IBM Plex Mono`) is used for ALL numbers, even in card headers — feels like a code editor
- Body text (`Sora`) lacks adequate weight variation — everything looks the same size/weight
- Display font (`Outfit`) is underused — only appears in page titles

### 4.2 Revised Type Scale

| Role | Font | Weight | Size | Usage |
|------|------|--------|------|-------|
| Page title | Outfit | 700 | 28px | "Overview", "Taps", "Sessions" |
| Section heading | Outfit | 600 | 20px | "Taps", "Last 7 days", "Band ratios" |
| Card title | Sora | 600 | 16px | Tap names, device names |
| KPI value (large) | Outfit | 700 | 36px | Hero metric: "6.22 L" — NOT monospace |
| KPI value (medium) | Outfit | 600 | 24px | Secondary metrics in cards |
| KPI label | Sora | 500 | 11px / uppercase / tracking wide | "LITERS TODAY", "ACTIVE SESSIONS" |
| Body text | Sora | 400 | 14px | Descriptions, paragraphs |
| Table header | Sora | 600 | 12px / uppercase / tracking wide | Column headers |
| Table cell | Sora | 400 | 14px | Data values |
| Table cell (numeric) | IBM Plex Mono | 400 | 14px | Liter values in tables ONLY |
| Badge/pill text | Sora | 500 | 12px | Status badges, phase pills |
| Timestamp | Sora | 400 | 13px | "Oct 3, 07:18 PM" — NOT monospace |
| Code/ID (admin only) | IBM Plex Mono | 400 | 13px | `device_01`, `tap_a` — hidden from normal view |

### 4.3 Key Typography Rules

> [!IMPORTANT]
> **Rule 1:** Monospace is ONLY for numeric data values inside tables and for technical IDs shown to admin users. Never for page titles, card headers, timestamps, or KPI hero numbers.

> [!IMPORTANT]
> **Rule 2:** KPI hero numbers use Outfit Bold — they should feel like a headline, not a terminal readout.

> [!IMPORTANT]
> **Rule 3:** Technical IDs (`tap_a`, `device_01`, `building_hostel`) are HIDDEN in normal view. Show human-readable names ("Tap A", "Washroom ESP", "Hostel Block"). IDs appear only on hover/tooltip or in a dedicated admin "Details" panel.

---

## 5. Iconography & Visual Language

### 5.1 Icon Set
Continue with **Lucide** but use icons more intentionally:

| Context | Icon | Treatment |
|---------|------|-----------|
| Sidebar nav active | Filled variant OR icon + colored left bar | Not just blue text |
| Online status | `circle` (filled) | 8px, with soft glow shadow in `--status-online` |
| Tap A (Control) | `shield` or `lock` | Distinctive from intervention taps |
| Intervention tap | `droplets` | Clearly different from control |
| Device | `cpu` or `radio` | Not `((o))` which reads as wifi |
| Alert | `bell` with dot badge | Standard notification pattern |
| Flowing now | `activity` with pulse animation | Conveys real-time data |
| Export/download | `download` | On report buttons |
| Phase indicator | `milestone` or numbered circle | Timeline context |

### 5.2 Empty State Illustrations
Replace blank white voids with **purpose-built empty states**:

| Page | Empty state message | Visual |
|------|-------------------|--------|
| Overview (no data) | "Waiting for first flow readings from your sensors" | Simple line illustration of a tap with a droplet |
| Sessions (no sessions) | "No water flow events recorded yet — sessions appear here when a tap is used" | Timeline illustration with dashed placeholder entries |
| Alerts (no alerts) | "All systems healthy — no alerts to report" | ✓ Checkmark with subtle green wash |
| Devices (single device) | Keep device card but fill remaining space with a "Fleet overview" section showing connection stats | Small map/diagram of sensor placement |
| Chart (no data) | "Collecting data — your first trend chart will appear after 24 hours" | Faded/ghosted chart axes with a dotted line |

### 5.3 Water-Domain Visual Touches (Subtle, Not Cartoonish)
- **KPI card accent:** a very thin (2px) gradient bar at the top of KPI cards, using brand colors — evokes a water level indicator
- **Flowing indicator:** when a tap is actively flowing, show a subtle animated ripple ring around the online dot
- **Threshold bar:** the green→amber→red bar on the Thresholds page is good — refine it with smoother gradients and rounded ends
- **Phase timeline:** use a vertical pipe/flow metaphor instead of simple dots-and-lines

---

## 6. Layout & Spacing System

### 6.1 Grid & Spacing

| Token | Value | Usage |
|-------|-------|-------|
| `--space-1` | 4px | Tight internal padding |
| `--space-2` | 8px | Default gap between related elements |
| `--space-3` | 12px | Card internal padding |
| `--space-4` | 16px | Between cards in a row |
| `--space-5` | 20px | Section gaps |
| `--space-6` | 24px | Card padding |
| `--space-8` | 32px | Between major page sections |
| `--space-10` | 40px | Page top padding |

### 6.2 Sidebar Redesign

**Current:** 240px, flat white, text-only nav items with icon

**Proposed:**
```
Width: 260px
Background: --bg-subtle (#E8EEF4) with subtle gradient overlay
Border-right: 1px solid --line

Brand area (top):
  ┌─────────────────────────┐
  │  💧 TapSense             │  ← Icon + wordmark, Outfit 700 18px
  │  Pilot Monitoring        │  ← Sora 400 12px, --ink-tertiary
  └─────────────────────────┘

Nav groups (with collapsible headers):
  MONITOR ─────────────────
  │ ■ Overview               │  ← Active: brand-100 bg, brand-600 text, 3px left border
  │ ○ Taps                   │
  │ ○ Sessions               │
  │ ○ Devices                │
  │ ○ Alerts                 │
  
  SCIENCE ─────────────────   ← Collapsed by default for facilities users
  │ ○ Phases                 │
  │ ○ Compare                │
  │ ○ Thresholds             │
  │ ○ Leaderboard            │
  
  ────────────────────────
  │ ○ Settings               │
  │ ○ Organization           │
```

**Key changes:**
- Sidebar has its own background color — not white like the content area
- Active nav item gets a filled background + left accent bar, not just blue text
- Group headers are collapsible — "SCIENCE" section collapses for non-admin users
- Remove "Locations", "Visibility", "Social field", "Control", "Members" from the main sidebar. Merge:
  - "Locations" → content within Overview or a tab on Overview
  - "Visibility" → moved into Settings
  - "Social field" → merged into Leaderboard page as a tab
  - "Control" → merged into Compare page as a tab/mode
  - "Members" → inside Settings page

### 6.3 Top Bar Redesign

**Current:** Breadcrumb + building dropdown + phase pill + avatar circle + "Log out" text — all crammed.

**Proposed:**
```
┌──────────────────────────────────────────────────────────────────┐
│  Pilot College › Hostel Block › Floor 1       🔔  [👤 TA ▾]     │
│                                                                  │
│  Phase 0 — Baseline  ·  1/1 devices online                     │
└──────────────────────────────────────────────────────────────────┘
```

**Changes:**
- Remove the building switcher dropdown from the top bar (move to sidebar or Overview)
- Phase pill stays but moves to the secondary line under the breadcrumb
- Add a notification bell icon (for alerts)
- User avatar becomes a dropdown menu (Profile, Settings, Log out) — remove the standalone "Log out" text button
- Add a device health indicator as a small status line ("1/1 devices online" with green dot)
- Remove the developer-facing banner entirely ("Physical pilot active — 1 ESP × 3 taps..."). This is admin config text, not top-bar content.

### 6.4 Content Area Layout

**Current:** Full-width content with no max-width feels stretched on wide screens.

**Proposed:**
- Max content width: **1200px**, centered within the content area
- Content area gets `padding: 40px 32px` (more breathing room)
- On screens >1440px, the extra space is distributed as even margin

---

## 7. Component-Level Redesign

### 7.1 KPI Stat Card

**Current:** Thin-bordered rectangle with uppercase label and monospace number. All cards look identical.

**Proposed:**
```
┌─────────────────────────────────┐
│ ▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰ (gradient) │  ← 2px top accent bar (brand gradient)
│                                 │
│  LITERS TODAY                   │  ← 11px, uppercase, tracking wide, --ink-tertiary
│  6.22 L                        │  ← Outfit 700, 36px, --ink-primary
│  ▲ 12% vs yesterday            │  ← 13px, Sora 400, --status-online (green)
│  All taps                       │  ← 12px, Sora 400, --ink-tertiary
│                                 │
└─────────────────────────────────┘

Shadow: 0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)
Border: 1px solid rgba(0,0,0,0.05)
Border-radius: 12px
Padding: 24px
```

**Key differences:**
- Top gradient accent bar (2px, brand-100 → brand-400) — gives each card visual identity
- Trend indicator ("▲ 12% vs yesterday") — adds data context
- Drop shadow instead of flat border-only — creates depth
- Rounded corners (12px) — feels modern, not boxy
- Hero number in Outfit Bold, not monospace

### 7.2 Tap Status Card

**Current:** Flat rectangle with tap name, ID, and liter value. Control badge is a gray pill.

**Proposed:**
```
┌───────────────────────────────────────────┐
│  🛡  Tap A                    ● online    │  ← Shield icon for control, green dot for status
│  Control Tap                              │  ← Steel gray badge with distinct style
│                                           │
│  0.00 L today                             │  ← Outfit 600, 20px
│  4.42 L this week                         │  ← Sora 400, 14px, --ink-secondary
│                                           │
│  Last activity: 6h ago                    │  ← 12px, --ink-tertiary
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━              │  ← Sparkline (last 7 days mini bar chart)
└───────────────────────────────────────────┘
```

**Key differences:**
- Distinct icon for control vs intervention taps
- Inline sparkline showing recent usage trend
- "Last activity" as relative time, not raw timestamp
- No technical ID (`tap_a`) visible — show only on hover tooltip
- Slightly different border treatment for control tap (dashed border or steel-tinted background)

### 7.3 Data Table

**Current:** Plain table with uppercase headers, no row hover, no visual rhythm.

**Proposed:**
- Alternating row backgrounds (white / `#F8FAFC`) for scanability
- Row hover: `--surface-elevated` background transition (100ms)
- Sticky header on scroll
- Numeric columns right-aligned
- Status values use colored dot + text (not pill soup)
- Sortable columns get a subtle caret indicator
- Table container gets its own card-like surface with padding and border-radius

### 7.4 Badge / Pill System

**Current:** Too many outline pills everywhere. `Mongo OK`, `Redis OK`, `control`, `intervention`, `multi_tap`, `dates unset` — visual noise.

**Proposed badge hierarchy:**

| Level | Style | Usage |
|-------|-------|-------|
| **Status badge** | Filled bg + icon + text (e.g., green bg + dot + "Online") | Device status, health indicators |
| **Role badge** | Subtle colored bg + text, no icon (e.g., steel bg + "Control") | Tap role |
| **Phase badge** | Brand bg + white text (e.g., teal bg + "Phase 0") | Current phase indicator |
| **Count badge** | Small pill with number (e.g., "3 taps") | Counts in headers |
| **Feature flag** | Checkbox + label (inside settings only) | Config toggles — NEVER in main UI |

> [!CAUTION]
> **Remove from public-facing UI:** `Mongo OK`, `Redis OK`, `Devices OK` health indicators, `multi_tap`, `single_tap`, `building_hostel`, `zone_washroom`, and any other internal system strings. These belong in a dedicated "System Health" section inside Settings > Organization, not on the Overview page.

### 7.5 Warning/Info Callouts

**Current:** Yellow banners with inline text on every science page — creates banner blindness.

**Proposed:**
- Use callouts sparingly — maximum ONE per page
- Replace repeated warnings with a **one-time dismissible onboarding tooltip** or a static note in the page description
- Style callouts with left border accent (not full background fill):

```
│ ℹ️  Pilot N is small — treat deltas as descriptive,    │
│     not powered causal proof.                           │
│                                                         │
│     4px left border in --status-info                    │
│     Background: --status-info-bg at 40% opacity         │
```

### 7.6 Buttons

Establish a strict 3-tier button system:

| Tier | Style | Usage |
|------|-------|-------|
| **Primary** | Filled `--brand-600`, white text, 8px radius, subtle shadow | Main CTA per page (max 1 per section) |
| **Secondary** | `--brand-50` bg, `--brand-700` text, no shadow | Alternative actions ("Export", "Preview") |
| **Ghost** | Transparent bg, `--ink-secondary` text, border on hover | Tertiary ("Phase dates", "Edit") |
| **Danger** | `--status-danger` fill, white text | Destructive only ("Reset today") |

**Current problem:** Too many teal-filled buttons on pages like Reports and Leaderboard. Multiple primary-looking buttons fight for attention. Demote secondary actions to the Secondary tier.

---

## 8. Screen-by-Screen Redesign Specification

### 8.1 Login Page (`/login`)

**Current issue:** Likely a plain centered form (consistent with the overall flat aesthetic).

**Proposed redesign:**

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│              ╔══════════════════════════════╗                │
│              ║                              ║                │
│              ║    💧 TapSense               ║                │
│              ║    Pilot Water Monitoring     ║                │
│              ║                              ║                │
│              ║    ┌──────────────────────┐   ║                │
│              ║    │ Email                 │   ║                │
│              ║    └──────────────────────┘   ║                │
│              ║    ┌──────────────────────┐   ║                │
│              ║    │ Password             │   ║                │
│              ║    └──────────────────────┘   ║                │
│              ║                              ║                │
│              ║    [ ████ Sign in ████ ]      ║                │
│              ║                              ║                │
│              ╚══════════════════════════════╝                │
│                                                             │
│    Left half: subtle atmospheric visual —                   │
│    abstract water ripple / wave pattern in brand-100/50     │
│    with very gentle CSS animation                           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Specifics:**
- **Split layout:** Left 55% has an abstract water-inspired background (CSS gradient animation with brand-50 and brand-100 colors, subtle wave/ripple keyframes). Right 45% is the form panel.
- **Form panel:** White surface with 32px padding, 16px radius, subtle shadow
- **Brand mark:** Outfit 700 28px, deep teal, centered in form panel
- **Subtitle:** Sora 400 14px, --ink-tertiary, "Pilot Water Monitoring"
- **Inputs:** 48px height, 12px radius, 1px border --line, focus ring in brand-600
- **Sign in button:** Full-width, 48px height, brand-600 fill, 8px radius
- **Error state:** Inline red text below the relevant field + red border on the field
- **Motion:** Form panel fades in + rises 8px on load (200ms ease-out)

---

### 8.2 Overview Page (`/` — Home Dashboard)

**Current issues:**
- Developer banner noise at top
- Flat KPI cards with no trend context
- Empty chart area
- Tap cards with visible technical IDs
- Badge soup (Mongo OK, Redis OK)

**Proposed redesign:**

```
┌─────────────────────────────────────────────────────────────┐
│  Overview                                                    │
│  Hostel Block · Floor 1 · Washroom                          │
│  Phase 0 — Baseline · Live every 3s                         │
│                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ LITERS   │  │ LITERS   │  │ ACTIVE   │  │ DEVICE   │   │
│  │ TODAY    │  │ THIS WEEK│  │ SESSIONS │  │ STATUS   │   │
│  │ 6.22 L   │  │ 6.22 L   │  │ 0        │  │ Online   │   │
│  │ ▲ 8%     │  │          │  │ Flowing  │  │ 5h ago   │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│                                                             │
│  ┌─── Live Flow ────────────────────────────────────────┐   │
│  │  ● No taps flowing right now                          │   │
│  │    Open a faucet to see a live session appear here.   │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─── Tap Status ──────────────────────────────────────┐   │
│  │                                                      │   │
│  │  [Tap A card]    [Tap B card]    [Tap C card]       │   │
│  │   🛡 Control      💧 Intervention  💧 Intervention  │   │
│  │   0.00 L          2.27 L          1.46 L            │   │
│  │   ━━━━━━━━        ━━━━━━━━        ━━━━━━━━          │   │
│  │                                                      │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─── Weekly Trend ─────────────────────────────────────┐   │
│  │                                                       │   │
│  │   ████                                                │   │
│  │   ████  ████                                          │   │
│  │   ████  ████  ████                                    │   │
│  │   ────  ────  ────  ────  ────  ────  ────           │   │
│  │  09-28  09-29 09-30 10-01 10-02 10-03 10-04          │   │
│  │                                                       │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Specific changes:**
1. **Remove** the developer banner ("Physical pilot active — 1 ESP × 3 taps...") entirely
2. **Remove** Mongo/Redis/Devices health pills from the Overview — move to Settings > System Health
3. **Remove** the row of action pills ("Tag phase dates", "Compare phases", "Color thresholds", "Leaderboard", "Social field", "Export CSV") — these are sidebar navigation destinations, not overview actions
4. **Add** trend indicators to KPI cards (▲/▼ % vs previous day/week)
5. **Add** a "Live Flow" section that shows real-time sessions (already exists but needs better visual treatment — dedicated card with animated border when active)
6. **Add** sparklines inside tap cards for mini weekly trend
7. **Add** a proper chart component for "Weekly Trend" — use stacked bar chart (one color per tap) with labeled axes
8. Phase badge moves to the page subtitle area, not a floating pill
9. Building switcher moves to sidebar header area

---

### 8.3 Taps Page (`/taps`)

**Current issues:** Plain table with no visual distinction, technical IDs visible.

**Proposed:**
- **Tab filters** ("All", "Control", "Intervention") get a pill-style selector with filled active state, not outline-only
- **Table redesign:**
  - Remove the `tap_a`, `tap_b`, `tap_c` ID column — show human names only
  - Add a small colored dot before each tap name (steel for control, teal for intervention)
  - Role column uses styled badges (filled background, not outline)
  - Numeric columns right-aligned, using Plex Mono
  - Add a "Trend" column with a tiny inline sparkline (last 7 days)
  - Add subtle row borders and hover highlight
  - "Last seen" uses relative time ("6h ago") with tooltip for absolute time
- **Click interaction:** clicking a row navigates to tap detail with a smooth page transition

---

### 8.4 Sessions Page (`/sessions`)

**Current issues:** Raw data table, date pickers use browser default styling.

**Proposed:**
- **Custom date picker** styled to match the design system (brand-colored selected dates, proper padding)
- **Tap filter** uses styled select/dropdown, not browser default
- **Table enhancements:**
  - Duration values get a subtle color hint (green for short, amber for medium, red for long-tail)
  - "Long-tail" flag replaced with a small icon indicator (⚠) instead of a text dash
  - Add row expansion on click to show session detail (flow curve if available)
  - Add pagination or infinite scroll with "Load more" button
- **Empty state:** "No sessions match your filters. Try adjusting the date range."

---

### 8.5 Devices Page (`/devices`)

**Current issues:** Single device card floating in massive empty white space.

**Proposed:**
- **Device card redesign:**
  ```
  ┌─────────────────────────────────────────────────────┐
  │  ● Online                            multi-tap       │
  │                                                      │
  │  Washroom ESP Pilot                                  │
  │  Firmware: 0.1.0-pilot · RSSI: -57 dBm              │
  │                                                      │
  │  Connected Taps:                                     │
  │  ┌─────────┐  ┌─────────┐  ┌─────────┐             │
  │  │  Tap A   │  │  Tap B   │  │  Tap C   │             │
  │  │ 🛡 Ctrl  │  │ 💧 Int   │  │ 💧 Int   │             │
  │  └─────────┘  └─────────┘  └─────────┘             │
  │                                                      │
  │  Last report: Oct 3, 07:19 PM (5h ago)               │
  │  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━             │
  │  Signal strength timeline (24h sparkline)            │
  └─────────────────────────────────────────────────────┘
  ```
- **Fill the remaining space** with a "Fleet Summary" section:
  - Connection uptime percentage (bar)
  - Last 24h signal strength chart
  - Data points received today count
- Remove `device_01` from prominent display — show "Washroom ESP Pilot" as the name

---

### 8.6 Alerts Page (`/alerts`)

**Current issues:** Empty page with just "0 open" and "No open alerts" text.

**Proposed:**
- When empty: show a positive illustration with "All systems healthy — no active alerts"
- Add tabs: "Open", "Resolved", "All"
- When alerts exist, use a card-list format (not table):
  ```
  ┌─ ⚠ ──────────────────────────────────────────────────┐
  │  Device Offline — Washroom ESP Pilot                   │
  │  No data received for 15 minutes                       │
  │  Triggered: Oct 3, 08:30 PM                           │
  │                                                        │
  │  [Acknowledge]  [View Device]                          │
  └────────────────────────────────────────────────────────┘
  ```

---

### 8.7 Phases Page (`/phases`)

**Current issues:** Timeline uses basic card layout, "dates unset" pills are confusing.

**Proposed:**
- **Visual timeline** with a vertical pipe/line connecting phases:
  - Active phase: filled circle, brand-colored card with white text
  - Future phases: outlined circle, gray card
  - Completed phases: checkmark circle, subtle green accent
- **Date range display** uses a clear "Start → End" format, not monospace
- Remove "dates unset" pill — instead show "Configure dates" as a subtle inline action link
- Add progress context: "You are here" indicator on the timeline

---

### 8.8 Compare Page (`/compare`)

**Current issues:** Yellow warning banner, basic dropdowns, empty results area.

**Proposed:**
- Replace the yellow warning banner with a **one-line italic note** under the page subtitle: *"Pilot sample is small — treat deltas as descriptive, not powered causal proof."*
- **Side-by-side phase picker** with visual preview of each phase's date range
- **Results area** (when populated): use a two-column comparison layout with ↑↓ delta indicators and color coding
- Add an empty state illustration when no comparison has been run yet

---

### 8.9 Thresholds Page (`/thresholds`)

**Current issues:** Reasonable layout but raw technical IDs visible, inconsistent spacing.

**Proposed:**
- The green→amber→red gradient bar is **good** — keep it but add rounded caps and smoother gradient
- Per-tap threshold cards should show tap human names prominently, IDs hidden
- Add a **live preview** mini-visualization: a small bar chart showing how current sessions would be colored under the current thresholds
- "Save" buttons get consistent secondary button styling
- Remove "Showcase" taps from this view unless the showcase_scale flag is enabled

---

### 8.10 Leaderboard Admin Page (`/leaderboard`)

**Current issues:** Form-heavy admin view and bland public board preview.

**Proposed:**
- **Admin section:** clean form layout with preview pane to the right (split view)
- **Public board redesign** — this is the most visible surface to professors:
  ```
  ┌─────────────────────────────────────────────────┐
  │                                                  │
  │         Hostel — Weekly Water                   │
  │    Lowest use earns quiet recognition           │
  │                                                  │
  │    Week: Sep 28 → Oct 4                         │
  │                                                  │
  │    ┌─── 🏆 ─────────────────────────────────┐    │
  │    │  1  Tap C                   0.00 L     │    │  ← Gold accent bar, trophy icon
  │    └────────────────────────────────────────┘    │
  │                                                  │
  │    ┌────────────────────────────────────────┐    │
  │    │  2  Tap B                   2.19 L     │    │  ← Silver accent, subtle
  │    └────────────────────────────────────────┘    │
  │                                                  │
  │    Updated Oct 3, 7:04 PM                       │
  │                                                  │
  └─────────────────────────────────────────────────┘
  ```
- The winning tap gets a subtle gold/brass accent (`#B8860B` toned down to `#C9A84C` with low opacity bg)
- Large typography for rank numbers (Outfit 700 32px)
- Auto-refresh animation: gentle fade transition when data updates

---

### 8.11 Settings Page (`/settings`)

**Current issues:** Feels like a developer config dump. Phase buttons, reset buttons, feature flags, and profile info all mixed together.

**Proposed restructure:**

| Section | Content | Placement |
|---------|---------|-----------|
| **Profile** | User info, email, log out | Top card |
| **Product Phase** | Phase selector (Phase 0–3) with description | Dedicated section below profile |
| **Data Management** | "Reset today's data" with confirmation modal | Collapsible section, danger-styled |
| **System Health** | Mongo/Redis/Device status, API checks | **Moved here** from Overview |
| **Organization** | Separate page at `/settings/organization` | Feature flags, timezone, name |
| **Members** | Separate page at `/settings/members` | Role management |

- Each section lives in its own card with proper spacing
- Dangerous actions (Reset) require a typed confirmation modal, not a single click
- Feature flags page is admin-only and clearly labeled as advanced configuration

---

### 8.12 Reports Page (`/reports`)

**Current issues:** Too many buttons of the same style, export actions are confusing.

**Proposed:**
- **Date range picker** at the top with quick-select buttons (styled as secondary chips, not primary buttons)
- **Download section** uses a clean list format:
  ```
  ┌── Export Data ──────────────────────────────────────┐
  │                                                     │
  │  📊 Sessions CSV                    [Download]      │
  │  📊 Sessions JSON                   [Download]      │
  │  📊 Daily Aggregates CSV            [Download]      │
  │  📊 Daily Aggregates JSON           [Download]      │
  │                                                     │
  └─────────────────────────────────────────────────────┘
  ```
- Download buttons are secondary style (not teal-filled)
- "Reconcile yesterday" moves to an "Advanced" collapsible section

---

### 8.13 Social Field Page (`/social`)

**Recommendation:** Merge this page into the Leaderboard page as a tab ("Board" | "Social Field"). The content overlaps significantly. Reduces sidebar clutter by one item.

---

### 8.14 Locations Page (`/locations`)

**Recommendation:** Merge the tree view into the Overview page as a secondary panel or make it accessible via the building switcher. For a 3-tap pilot, a dedicated "Locations" page is over-engineered. Keep the route but hide it from the sidebar in pilot mode. Surface it when the system scales to multiple buildings.

---

### 8.15 Organization Page (`/settings/organization`)

**Current issues:** Feature flags exposed as raw checkboxes with developer labels like `science_ui`, `visibility_kiosk`, `showcase_scale`.

**Proposed:**
- Group flags into categories: "Science Tools", "Public Displays", "Experimental"
- Each flag gets a human-readable title AND description
- Use toggle switches instead of checkboxes
- Add a "Save" button at the bottom with a success toast on save

---

## 9. Motion & Interaction Design

### 9.1 Motion Budget (Intentional, Not Decorative)

| Motion | Duration | Easing | Trigger |
|--------|----------|--------|---------|
| **Page transition** | 180ms | ease-out | Route change |
| **Card enter** | 200ms | ease-out | Page load (staggered by 40ms per card) |
| **KPI count-up** | 600ms | ease-out | First paint of data |
| **Chart draw** | 400ms | ease-out | Chart data load |
| **Online pulse** | 1.8s | ease-in-out, infinite | Device/tap online indicator |
| **Flow ripple** | 1.2s | ease-in-out, infinite | Active flow session indicator |
| **Hover lift** | 120ms | ease-out | Card hover (translateY -2px + shadow increase) |
| **Button press** | 80ms | ease-in | Click (scale 0.97) |
| **Toast enter** | 200ms | ease-out | Notification appear (slide down + fade) |
| **Toast exit** | 150ms | ease-in | Auto-dismiss (fade out) |
| **Sidebar active** | 200ms | ease-out | Nav item slide indicator bar |

### 9.2 Staggered Load Pattern
When a page loads with multiple cards (e.g., Overview with 4 KPI cards + 3 tap cards):
1. Cards fade-in + rise (8px) with 40ms stagger between each
2. KPI numbers start at 0 and count up to their values over 600ms
3. Charts draw from left to right over 400ms

This creates a **cascade effect** that feels alive without being distracting.

### 9.3 Reduced Motion
Respect `prefers-reduced-motion`:
- Replace all transforms with simple opacity fades
- Disable infinite animations (pulse, ripple)
- Keep functional transitions (page enter, toast) but at 0ms

---

## 10. Data Visualization Strategy

### 10.1 Chart Library
Use **Recharts** (already common in Next.js ecosystems) or **Chart.js** with custom theming.

### 10.2 Chart Types by Page

| Page | Chart | Type |
|------|-------|------|
| Overview | Weekly trend | Stacked bar (one color per tap) |
| Tap detail | Daily usage | Area chart with gradient fill |
| Tap detail | Session distribution | Scatter plot or histogram |
| Compare | Phase delta | Grouped bar (Phase A vs Phase B) |
| Thresholds | Band preview | Horizontal gradient bar with markers |
| Leaderboard | Ranking | Horizontal bar chart (sorted) |

### 10.3 Chart Theming Rules
- **Background:** transparent (sits on surface card)
- **Grid lines:** `--chart-grid` (`#E2E8F0`), horizontal only
- **Axis labels:** Sora 400 12px, `--ink-tertiary`
- **Data labels:** Only on hover (tooltip)
- **Control tap:** Always dashed line/border in steel gray
- **Tooltip:** Surface card with shadow, compact format: "Oct 3: 2.19 L"
- **Empty chart:** Show faded axes + "Collecting data..." message, never a blank white rectangle

---

## 11. Responsive & Accessibility

### 11.1 Breakpoints

| Breakpoint | Width | Layout |
|------------|-------|--------|
| Desktop XL | ≥1440px | Sidebar + full content, max-width centered |
| Desktop | 1024–1439px | Sidebar + content |
| Tablet | 768–1023px | Collapsible sidebar, 2-column KPIs |
| Mobile | <768px | Drawer nav, stacked layout, full-width cards |

### 11.2 Accessibility Requirements

| Requirement | Implementation |
|-------------|----------------|
| Color contrast | AA minimum for all text (verify with brand teal on white) |
| Status not color-only | Always pair color with icon or text label |
| Focus indicators | Brand-colored focus ring (2px solid `--brand-600` with 2px offset) |
| Keyboard navigation | All interactive elements reachable via Tab |
| Screen reader | Semantic HTML, proper `aria-label` on icon-only buttons |
| Reduced motion | Full support via `prefers-reduced-motion` media query |
| Touch targets | ≥44px on all clickable elements |

---

## 12. Implementation Priority & Phasing

### Phase 1: Foundation (Do First — 2-3 days)
- [ ] Update CSS variables / Tailwind config with new color tokens
- [ ] Update typography scale (Outfit for headings/KPIs, restrict monospace)
- [ ] Redesign sidebar (background, active state, remove bloat items)
- [ ] Redesign top bar (remove banner, clean up layout)
- [ ] Create new KPI stat card component
- [ ] Create new badge/pill system

### Phase 2: Core Pages (Next — 3-4 days)
- [ ] Redesign Login page (split layout, atmospheric background)
- [ ] Redesign Overview page (remove developer noise, add trends, fix chart)
- [ ] Redesign Tap cards (sparklines, hide IDs, distinguish control)
- [ ] Redesign data tables (hover, alignment, styling)
- [ ] Implement proper empty states for all pages

### Phase 3: Secondary Pages (Then — 2-3 days)
- [ ] Sessions page refinement (styled date pickers, colored durations)
- [ ] Devices page (fill empty space, device detail card)
- [ ] Alerts page (empty state, card-list format)
- [ ] Settings page (restructure sections, move system health here)

### Phase 4: Science & Behavior Pages (Then — 2-3 days)
- [ ] Phases page (visual timeline redesign)
- [ ] Compare page (remove banner, add results visualization)
- [ ] Thresholds page (polish gradient bar, live preview)
- [ ] Leaderboard page (merge Social field, redesign public board)
- [ ] Reports page (demote button hierarchy, clean export list)

### Phase 5: Polish Pass (Final — 1-2 days)
- [ ] Motion system implementation (staggered loads, count-up, chart draw)
- [ ] Responsive testing across breakpoints
- [ ] Accessibility audit (contrast, focus rings, keyboard nav)
- [ ] Cross-browser testing

---

> [!TIP]
> **Total estimated effort:** 10–15 days for one developer, working through the phases above. Phase 1 (Foundation) creates the most dramatic visual improvement with the least code changes — start there for the fastest "wow" impact.

---

*This document is the authoritative source for all TapSense UI/UX changes. Every edit to the frontend should be validated against the specifications in this plan.*
