# Phase 17 — Leaderboard System

**Goal:** Social-norm infrastructure ready before public field display (Phase 18).

**Framing:** Lowest use earns quiet recognition. No shame copy. Never person IDs.

---

## What shipped

| Layer | Behavior |
|---|---|
| Weekly aggregates | Tap / zone / floor / building totals for Mon–Sun campus week |
| Board config | `leaderboard_boards` — scope, exclude control, public flag |
| Snapshots | Ranked list + winner; rebuilt on demand + ~hourly worker |
| Public API | `GET /api/v1/public/leaderboard/{boardId}` (limited fields, no auth) |
| Admin UI | `/leaderboard` configure · `/leaderboard/live` fullscreen preview |
| Public board | `/leaderboard/public/[boardId]` — brand, auto-refresh, calm ranks |

Default board id: `board_pilot` (tap scope, control excluded).

---

## Teammate flow

1. Ensure daily data exists for the week (ESP logging).  
2. Open `/leaderboard` → **Rebuild snapshot**.  
3. Confirm control Tap A is absent when “Exclude control” is on.  
4. Open **Live preview** or public URL on a TV/kiosk.  
5. Phase 18: place the board in a common area and lock weekly cadence.

---

## API cheatsheet

```http
GET  /api/v1/leaderboard/boards
PATCH /api/v1/leaderboard/boards/board_pilot
GET  /api/v1/leaderboard/weekly?week_start=2026-09-29
GET  /api/v1/leaderboard/boards/board_pilot/snapshot?refresh=true
POST /api/v1/leaderboard/refresh
GET  /api/v1/public/leaderboard/board_pilot
```

---

## Verification checklist

- [ ] Snapshot ranks intervention taps by lowest liters  
- [ ] Control excluded when option on  
- [ ] Public board loads without login  
- [ ] Live preview auto-refreshes  
- [ ] Worker refresh logs `leaderboard snapshots refreshed` ~hourly  
