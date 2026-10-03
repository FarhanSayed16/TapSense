# Phase 4 — Backend B0 Skeleton (Status)

**Goal:** FastAPI runs, Mongo ping on health, CORS ready — no business features yet.

## 4.1 Project layout — DONE

- [x] `app/main.py` entry
- [x] `app/core` config + logging
- [x] `app/db` Mongo client (`serverSelectionTimeoutMS=3000`)
- [x] Packages: `api/`, `services/`, `mqtt/`, `models/`, `schemas/`, `workers/`, `utils/`
- [x] `scripts/` for Phase 5 seed

## 4.2 Core wiring — DONE

- [x] Env via pydantic-settings (`.env` / `.env.example`)
- [x] `GET /health` and `GET /api/v1/health`
- [x] Mongo ping in lifespan + health payload (`status: ok | degraded`)
- [x] CORS for `http://localhost:3000` (+ Vercel preview regex)

## 4.3 Deploy skeleton — PREP DONE (you click deploy)

- [x] `render.yaml` at repo root (`tapsense-api`)
- [ ] Create Render Web Service from blueprint / `backend` root — **your account**
- [ ] Set `MONGODB_URI` + `CORS_ORIGINS` on Render
- [ ] Confirm public `/health`

## Local run (verified path)

Use **Python 3.12** (3.14 breaks pydantic wheels on Windows):

```powershell
cd backend
py -3.12 -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env   # if needed
uvicorn app.main:app --reload --port 8000
```

Health: http://127.0.0.1:8000/health

### Mongo for green health

1. Start **Docker Desktop**, then:
   ```powershell
   docker run -d --name tapsense-mongo -p 27017:27017 mongo:7
   ```
2. Or put Atlas URI in `backend/.env` as `MONGODB_URI`.

Until Mongo is up, health returns `"status": "degraded", "mongo": false` — API still runs (Phase 4 OK for skeleton; Phase 5 needs mongo true).

## Phase 4 gate

| Item | Status |
|---|---|
| Local health responds | **Done** (run uvicorn) |
| Layout + logging + CORS | **Done** |
| Mongo connected | **Pending your Docker/Atlas** |
| Render public health | **Pending your deploy** |

**Repo Phase 4 complete.** Connect Mongo → then Phase 5 (seed + auth).
