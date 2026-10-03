# TapSense API (FastAPI)

## Requirements

- **Python 3.12** (recommended). Python 3.14 may fail to install `pydantic-core` on Windows.
- MongoDB (Docker `mongo:7` on `localhost:27017` or Atlas URI)

## Run locally

```powershell
cd backend
py -3.12 -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
uvicorn app.main:app --reload --port 8000
```

- Health: http://127.0.0.1:8000/health  
- Docs: http://127.0.0.1:8000/docs  

### Local Mongo (Docker)

```powershell
docker run -d --name tapsense-mongo -p 27017:27017 mongo:7
```

## Deploy (Render)

See repo-root `render.yaml`. Set secrets: `MONGODB_URI`, `CORS_ORIGINS`, `JWT_SECRET`, `DEVICE_API_KEY`.

## Seed + auth (Phase 5)

```powershell
# Mongo must be running (Docker Desktop + tapsense-mongo)
docker start tapsense-mongo
.\.venv\Scripts\python -m scripts.seed
uvicorn app.main:app --reload --port 8000
```

## Baseline report (Phase 11)

```powershell
.\.venv\Scripts\python -m scripts.baseline_report --start YYYY-MM-DD --end YYYY-MM-DD
```

Also: `GET /api/v1/reports/baseline?start=&end=` (admin JWT).  
Protocol: `docs/phase-11-baseline-protocol.md`
