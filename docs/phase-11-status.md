# Phase 11 — Silent Baseline (Status)

**Goal:** 10–14 days of silent logging + honest go/no-go for visibility.  
**Protocol:** `docs/phase-11-baseline-protocol.md`

## Repo support — DONE

| Item | Path |
|---|---|
| Run protocol | `docs/phase-11-baseline-protocol.md` |
| Daily ops log | `docs/phase-11-daily-ops-log.md` |
| Baseline note + GO/NO-GO template | `docs/phase-11-baseline-note-template.md` |
| Report script | `python -m scripts.baseline_report` |
| Report API | `GET /api/v1/reports/baseline?start=&end=` |
| Output folder | `docs/baseline-reports/` |

## Your field work — PENDING (after Phase 10 gate)

1. Start silent run · record dates in protocol  
2. Fill daily ops log  
3. After ≥10 days: run report → fill note → **GO / NO-GO**  

## Gate
- [ ] ≥10 days clean data  
- [ ] Baseline note written  
- [ ] Go/no-go recorded  

## Commands

```powershell
cd backend
.\.venv\Scripts\python -m scripts.baseline_report --start 2026-10-03 --end 2026-10-16
```

Then → Phase 12 MVP closeout.
