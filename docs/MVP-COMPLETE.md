# TapSense MVP — Software Complete

**Date closed (software):** 2026-10-03  
**Scope:** Pilot MVP Phases 1–12 **in-repo**. Field gates (permissions, hardware, 10–14 day baseline) remain yours on site.

This file is the **MVP finish line for code & docs**. Use `docs/phase-12-mvp-closeout.md` to tick physical acceptance.

---

## What is finished in the repo

| Layer | Done |
|---|---|
| Product plans | Master doc, MVP plan, backend/frontend plans, 12-phase execution plan |
| Phase 1–2 | Facilities proposal, site lock, BOM |
| Phase 3 | Monorepo, conventions, accounts checklist |
| Phase 4 | FastAPI B0 health + Mongo + Render blueprint |
| Phase 5 | Seed hierarchy, admin JWT auth, read APIs |
| Phase 6 | MQTT + HTTP ingest, sessions, daily aggregates, simulate script |
| Phase 7–8 | Glacier Ops UI, shell, live Overview/Taps/Sessions/Device |
| Phase 9 | ESP32 firmware (3 taps), bench checklist, Serial `sim` |
| Phase 10 | Field install runbook, calibration API/UI/CLI |
| Phase 11 | Baseline protocol, ops log, note template, `baseline_report` |
| Phase 12 | Closeout pack, deferred list, Phase 1 readiness guide + optional display flag |

## Run the software stack anytime

```powershell
# Mongo
docker start tapsense-mongo

# API
cd backend
.\.venv\Scripts\activate
uvicorn app.main:app --reload --port 8000
# seed once: python -m scripts.seed

# Web
cd frontend
npm run dev
# http://localhost:3000/login
# admin@tapsense.app / TapSenseAdmin123!
```

## Field path still required for “MVP COMPLETE” stamp

1. Written facilities sign-off  
2. Buy/install Wave 1 kit · Phase 9–10 benches/field  
3. Phase 11 ≥10 day silent baseline + GO/NO-GO note  
4. Optional: Phase 1 displays on B/C only if GO  

## Explicitly deferred (not MVP)

Color thresholds · leaderboard product · valves · multi-building UI · Telegram · marketing site · PCB · 1-ESP-per-tap fleet · person tracking  

Continue later via `docs/full-master-execution-plan.md` / `backend-plan.md` B2+ / `frontend-plan.md` F2+.
