# MVP Deliverable — Handoff

## What operators need to run today
1. Mongo up  
2. `uvicorn app.main:app --port 8000`  
3. `npm run dev` in `frontend/`  
4. ESP firmware on `device_01` publishing to MQTT topic  

Login: `admin@tapsense.app` (password from `ADMIN_PASSWORD` in `backend/.env`).

## After field MVP close
| Audience | Give them |
|---|---|
| Project team | `docs/MVP-COMPLETE.md`, baseline note, known issues |
| Facilities | One-pager proposal + that Phases 0–1 are measure/display only (no valve) |
| Future builders | `full-master-execution-plan.md` from Phase 13 |

## Repos / folders
- `backend/` — API  
- `frontend/` — admin UI  
- `firmware/` — ESP32  
- `docs/` — plans & checklists  
