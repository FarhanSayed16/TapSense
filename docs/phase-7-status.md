# Phase 7 — Frontend Design System + App Shell (Status)

**Goal:** Glacier Ops locked; scalable shell ready before full data pages.

## Done

### 7.1 Bootstrap
- [x] Next.js + Tailwind
- [x] Fonts: Outfit · Sora · IBM Plex Mono
- [x] Lucide icons

### 7.2 Tokens
- [x] CSS + Tailwind tokens (bg, surface, ink, muted, brand, accent, line, ok/warn/danger, control)
- [x] Atmospheric mist/aqua background
- [x] 8px spacing / sidebar width

### 7.3 Components (`src/components/ui/`)
Button · Input/Label · Badge/StatusDot · KpiStat · DataTable · EmptyState · Skeleton · Toast · SidebarNavItem

### 7.4 Shell
- [x] Sidebar: Overview, Taps, Sessions, Device, Settings
- [x] Top bar: crumb · Phase 0 pill · user/logout
- [x] Mobile drawer
- [x] `AuthGuard` + login at `/login`

### 7.5 Motion
- [x] `animate-page-enter`
- [x] `animate-status-pulse`
- [x] `animate-metric-settle`
- [x] `prefers-reduced-motion` in `globals.css`

## Gate
- [x] `npm run build` succeeds
- [x] Shell routes: `/` `/taps` `/sessions` `/device` `/settings` `/login`
- [x] No Inter/Roboto/purple theme

## Run
```powershell
# API must be up for login
cd frontend
npm run dev
```
Open http://localhost:3000/login · `admin@tapsense.app` / `TapSenseAdmin123!`

## Next → Phase 8
Wire Overview / Taps / Sessions / Device to live `/api/v1` data.
