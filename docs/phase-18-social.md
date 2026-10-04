# Phase 18 — Product Phase 3 Social Comparison (Field)

**Goal:** Strongest literature lever live on campus — quiet recognition for lowest use.

**Science note:** Infrastructure can be demoed now. Fill the field report only after a real Phase 2 vs Phase 3 window.

---

## Rules (locked)

1. Recognition for **lowest** use only — positive framing  
2. **No shame / guilt copy** on board, posters, or LCD  
3. **Never person IDs** — tap / zone / floor / building only  
4. **Tap A (control)** stays uncued (no board “competition” for control liters as a shame target; exclude from ranking)  
5. Weekly cadence **locked** once the board is physically live  

---

## What shipped (dev path)

| Layer | Behavior |
|---|---|
| Settings | Phase 3 — Social toggle (`social_enabled`) |
| API | `GET/PATCH /social-field` · lock/unlock cadence · attribution helper |
| `/social` | Placement, checklist, recognition label, cadence lock, attribution |
| Public board | Uses Phase 3 recognition label when social is on |
| Firmware | `PRODUCT_PHASE_DISPLAY=3` → LCD `P3 SOCIAL` / `BOARD LIVE` on B/C path |

---

## Field runbook

1. **Leaderboard** — rebuild snapshot; confirm control excluded.  
2. **Settings** → Phase 3 — Social.  
3. **Social field** — set placement (lobby TV / common area), recognition label, refresh day.  
4. Place the screen; open `/leaderboard/public/board_pilot` on the TV.  
5. Complete checklist → **Lock weekly cadence**.  
6. Firmware: `PRODUCT_PHASE_DISPLAY=3` (optional; board is the main social cue).  
7. After the window: tag Phase 2 & 3 dates → attribution → fill report template.

---

## Verification checklist

- [ ] Board visible in a common area  
- [ ] Public URL auto-refreshes ranks  
- [ ] Cadence locked in `/social`  
- [ ] Control still uncued  
- [ ] No shame copy on board  
- [ ] Winner recognition framed as lowest use  

---

## Measure (later)

- Marginal drop vs Phase 2  
- Three-layer note: visibility → color → social  
- Template: `docs/phase-18-report-template.md`  
