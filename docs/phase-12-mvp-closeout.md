# Phase 12 — MVP Closeout Checklist

**Goal:** Close the MVP; optionally prepare product Phase 1 visibility (B/C only).  
**Software summary:** `docs/MVP-COMPLETE.md`

Split into **Repo** (done) vs **Field** (you). MVP is fully closed only when Field boxes are checked.

---

## 12.1 Acceptance

### Repo / verified in development
- [x] Each tap publishes stable `tap_id` (firmware + ingest contract)
- [x] Backend stores readings + sessions + daily aggregates
- [x] Admin login works (local); Overview/Taps/Sessions/Device live
- [x] Control tap flagged in UI (`tap_a`)
- [x] Glacier Ops UI + 3 motions
- [x] No per-person tracking in schema/UI/API
- [x] Calibration tooling (API / UI / CLI)
- [x] Baseline report tooling

### Field (required for formal close)
- [ ] Written facilities sign-off on file  
- [ ] 3 sensors installed, no active leaks  
- [ ] WiFi OK or fallback documented  
- [ ] Calibration values recorded (`docs/mvp-deliverables/calibration-record.md`)  
- [ ] Phase 0 baseline ≥10 days + note + GO/NO-GO  
- [ ] Deployed frontend/API (Vercel/Render) — optional but recommended  

---

## 12.2 Deliverables package

| Deliverable | Location | Status |
|---|---|---|
| Working pipeline docs + code | `backend/` `frontend/` `firmware/` | Done |
| Hierarchy seed | `python -m scripts.seed` | Done |
| Pin map | `docs/mvp-deliverables/pin-map.md` | Done |
| Calibration record | `docs/mvp-deliverables/calibration-record.md` | Template — fill on site |
| Known issues | `docs/mvp-deliverables/known-issues.md` | Done (living doc) |
| Deferred scope | `docs/mvp-deliverables/deferred-scope.md` | Done |
| Baseline findings | `docs/phase-11-baseline-note-template.md` + `baseline-reports/` | Fill after Phase 11 |
| Handoff | `docs/mvp-deliverables/handoff.md` | Done |

---

## 12.3 Phase 1 readiness (only if Phase 11 = GO)

See `docs/phase-12-phase1-readiness.md`

- [ ] Displays on **B and C only**  
- [ ] Tap A blank  
- [ ] Dashboard ≈ display liters  
- [ ] Same-weekday compare plan vs Phase 0  

---

## 12.4 Confirmed NOT started in MVP

See `docs/mvp-deliverables/deferred-scope.md` — Phase 2–4 product features, multi-building, Telegram, PCB, etc.

---

## 12.5 Handoff after MVP

| Next | Doc |
|---|---|
| Backend B2+ | `docs/backend-plan.md` |
| Frontend F2+ | `docs/frontend-plan.md` |
| Behavior Phases 1–4 | `docs/water-tap-project-master-doc.md` |
| Full campus execution | `docs/full-master-execution-plan.md` |

---

## Gate — MVP COMPLETE

- [ ] All **Field** boxes in 12.1 checked  
- [ ] Deliverables filled where templates require site data  
- [ ] Team sign-off: **MVP closed on _______________**  

**Software MVP closed:** 2026-10-03 (this repo state).
