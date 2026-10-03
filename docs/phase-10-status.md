# Phase 10 — Field Install & Calibration (Status)

**Goal:** Live on 3 real taps, sealed, calibrated, logging.  
**Runbook:** `docs/phase-10-field-install.md`  
**Calibration sheet:** `docs/phase-10-calibration-sheet.md`

## Repo support — DONE

| Item | Location |
|---|---|
| Field install checklist | `docs/phase-10-field-install.md` |
| Bucket calibration worksheet | `docs/phase-10-calibration-sheet.md` |
| API `PATCH /api/v1/taps/{id}/calibration` | backend |
| CLI `python -m scripts.set_calibration` | backend |
| Tap detail “Save calibration” UI | frontend |
| Calibration history collection | `calibration` in Mongo |

## Your site work — PENDING

### 10.1–10.3 Install
Follow runbook packing list → shutoff → inline sensors → IP box → power/WiFi

### 10.4 Calibrate
Fill sheet → update firmware `PULSES_PER_LITER_*` → update backend (UI or script)

### 10.5 Verify
Each tap maps to correct ID · Tap A = Control · photos · 24h soak

## Gate
- [ ] 24h continuous, no leaks, logging continuous  
Then → **Phase 11** silent baseline (no displays).

## Commands

```powershell
# Backend must be reachable from install laptop
cd backend
.\.venv\Scripts\python -m scripts.set_calibration --tap tap_a --ppl 455
```
