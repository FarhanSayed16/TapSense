# Phase 14 Status

| Item | Status |
|---|---|
| Phase date-window tags (`phase_windows`) | Done |
| Compare API (Δ liters / session / long-tail) | Done |
| Control vs intervention aggregates | Done |
| CSV/JSON session + daily exports | Done |
| Stale-device alert records + worker sweep | Done |
| Daily rollup reconcile (admin + ~6h worker) | Done |
| `/reports` page (windows · compare · export) | Done |
| Dedicated Phase 15 pages (`/phases` `/compare` `/control`) | Queued (Phase 15) |
| Verified on real Phase 0/1 field windows | Later (after baseline + visibility field runs) |

**Dev gate:** analytics endpoints + Reports UI work on existing Mongo data.  
**Science gate:** tag real Phase 0 vs 1 windows, then export/compare for the report note.
