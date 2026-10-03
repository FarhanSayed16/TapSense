# TapSense

College water-tap behavior system — IoT pilot + admin monitoring.

## Execute with

- **MVP software complete:** [`docs/MVP-COMPLETE.md`](docs/MVP-COMPLETE.md)
- **MVP closeout (field stamp):** [`docs/phase-12-mvp-closeout.md`](docs/phase-12-mvp-closeout.md)
- **MVP checklist:** [`docs/mvp-master-execution-plan.md`](docs/mvp-master-execution-plan.md)
- **Full project checklist:** [`docs/full-master-execution-plan.md`](docs/full-master-execution-plan.md)
- **Product decisions:** [`docs/water-tap-project-master-doc.md`](docs/water-tap-project-master-doc.md)

## Phase 1–2 (start here)

1. Fill [`docs/phase-1-facilities-proposal.md`](docs/phase-1-facilities-proposal.md) → get sign-off  
2. Fill [`docs/phase-1-site-lock.md`](docs/phase-1-site-lock.md) (lock Tap A/B/C)  
3. Order kit from [`docs/phase-2-bom-checklist.md`](docs/phase-2-bom-checklist.md)  
4. Wiring: [`hardware/CONNECTIONS.md`](hardware/CONNECTIONS.md)

## Repo layout

| Folder | Role |
|---|---|
| `backend/` | FastAPI + MongoDB + MQTT ingest |
| `frontend/` | Next.js admin (Glacier Ops) |
| `firmware/` | ESP32 Arduino pilot (canonical) |
| `hardware/` | Pointer / mirror → use `firmware/` |
| `docs/` | Plans & checklists |

**Phase 3:** [`docs/phase-3-status.md`](docs/phase-3-status.md) · [`docs/phase-3-conventions.md`](docs/phase-3-conventions.md)

## Quick start (after Phase 3 accounts)

```bash
# API
cd backend
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
uvicorn app.main:app --reload --port 8000

# Web
cd frontend
npm install
npm run dev
```
