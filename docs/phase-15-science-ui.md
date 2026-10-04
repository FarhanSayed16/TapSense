# Phase 15 — Science & Reporting UI

**Goal:** A non-engineer teammate can produce a Phase 0 vs 1 summary from the app.

---

## Nav (Science group)

| Page | Path | Job |
|---|---|---|
| Phases | `/phases` | Timeline 0–3 + campus date tags |
| Compare | `/compare` | Phase deltas + pilot-N honesty |
| Control | `/control` | Tap A vs B/C cohort split |
| Reports | `/reports` | CSV/JSON download packs + alerts |

Monitor nav (Overview · Taps · Sessions · Device · Visibility) is unchanged.

---

## Teammate flow (Phase 0 vs 1 summary)

1. **Settings** → set product phase when the field intervention starts (optional for tagging).
2. **Phases** → tag Phase 0 and Phase 1 start/end dates (+ short notes).
3. **Compare** → Phase 0 vs Phase 1 → read honesty banner + per-tap Δ L/day / session / long-tail.
4. **Control** → same window → confirm Tap A vs B/C split.
5. **Reports** → “Use Phase 0/1” → download Sessions CSV + Daily CSV for the pack.

Do **not** claim causal effect sizes until real field windows exist.

---

## Overview upgrades

- Phase badge links to `/phases`
- Extra status chip: visibility on / silent baseline
- Quick links: Tag phase dates · Compare · Control · Export CSV
- Top bar phase pill tracks live `product_phase`

---

## Verification checklist

- [ ] Science nav shows Phases · Compare · Control · Reports  
- [ ] Tag Phase 0 + Phase 1 dates on `/phases`  
- [ ] `/compare` runs without typing dates (uses tagged windows)  
- [ ] Honesty banner shows `pilot N = … sessions`  
- [ ] `/control` shows control vs intervention cards  
- [ ] `/reports` downloads CSV for a phase window  
- [ ] Overview links land on the right science pages  
