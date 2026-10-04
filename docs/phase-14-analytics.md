# Phase 14 — Pilot Analytics & Exports

**Goal:** Science endpoints so reports are not spreadsheet chaos.

**Science note:** APIs and the Reports page work on whatever data exists. Do **not** claim Phase 0 vs 1 effect sizes until tagged field windows exist.

---

## What shipped

| Layer | Behavior |
|---|---|
| `pilot_settings.phase_windows` | Date tags per product phase 0–3 |
| API windows | `GET/PATCH /api/v1/phase-windows` |
| Compare | `GET /api/v1/analytics/compare` — Δ L/day, session, long-tail |
| Control split | `GET /api/v1/analytics/control-vs-intervention` |
| Window metrics | `GET /api/v1/analytics/window` (baseline engine) |
| Exports | `GET /api/v1/exports/sessions` · `/exports/daily` (`json` \| `csv`) |
| Alerts | `GET /api/v1/alerts` + background stale sweep (~60s) |
| Reconcile | `POST /api/v1/admin/reconcile-daily` + worker ~6h |
| Admin UI | `/reports` — windows, compare, split, download, alerts |

Control tap A stays in exports/metrics for science; it never appears on `/visibility` or Phase 1 LCD.

---

## Quick API examples

```http
GET /api/v1/phase-windows
PATCH /api/v1/phase-windows
{"phase":0,"start":"2026-09-20","end":"2026-09-30","notes":"silent baseline"}

GET /api/v1/analytics/compare?phase_a=0&phase_b=1
GET /api/v1/analytics/compare?phase_a=0&phase_b=1&start_a=2026-09-20&end_a=2026-09-30&start_b=2026-10-01&end_b=2026-10-10

GET /api/v1/analytics/control-vs-intervention?start=2026-09-20&end=2026-09-30
GET /api/v1/exports/sessions?start=2026-09-20&end=2026-09-30&format=csv
GET /api/v1/alerts?refresh=true
POST /api/v1/admin/reconcile-daily
```

All require admin JWT except health/login.

---

## Verification checklist

- [ ] Set Phase 0 and Phase 1 date windows in `/reports` (or PATCH)
- [ ] Compare returns honesty banner + per-tap deltas
- [ ] Control vs intervention shows Tap A vs B/C cohort means
- [ ] Sessions CSV downloads with auth
- [ ] Stale device appears under Alerts when ESP offline > stale threshold
- [ ] Reconcile yesterday rebuilds `daily_aggregates` without wiping other days

---

## Phase 15 note

Dedicated `/phases`, `/compare`, `/control` pages remain queued. `/reports` is the Phase 14 verification surface and a usable early science UI.
