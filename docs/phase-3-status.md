# Phase 3 — Repo & Environment Foundations (Status)

**Goal:** Monorepo + env examples + locked conventions + account checklist.

## 3.1 Repository structure — DONE

- [x] `backend/` — FastAPI
- [x] `frontend/` — Next.js
- [x] `firmware/` — ESP32 Arduino (canonical)
- [x] Root `README.md` points at MVP master plan
- [x] Env examples: `backend/.env.example`, `frontend/.env.example`

## 3.2 Accounts & services — CHECKLIST READY (you complete offline)

See `docs/phase-3-accounts-checklist.md`

- [ ] MongoDB Atlas (or local Mongo) — **needed before Phase 5**
- [x] MQTT default decided: HiveMQ public `broker.hivemq.com` (swap later if needed)
- [ ] Render account + `tapsense-api` placeholder
- [ ] Vercel account + `tapsense-web` placeholder
- [ ] Password manager entry for secrets

## 3.3 Conventions — LOCKED

See `docs/phase-3-conventions.md`

- [x] Timezone: `Asia/Kolkata`
- [x] IDs: `org_pilot`, `tap_a`/`tap_b`/`tap_c`, `device_01`
- [x] MQTT topic: `tapsense/pilot/device_01/telemetry`
- [x] DB name: `tapsense`

## Phase 3 gate

| Gate item | Status |
|---|---|
| Folders exist | **Done** |
| Env examples exist | **Done** |
| Cloud accounts reachable | **Partial** — create Atlas (+ Render/Vercel) using checklist |

**Repo side of Phase 3 is complete.** Finish Mongo (and optional Render/Vercel) on the accounts checklist, then proceed to **Phase 4** (backend B0 already largely scaffolded — verify run + health).

## Next

→ Phase 4: confirm `uvicorn` health + Mongo ping  
→ Phase 5: seed hierarchy + admin auth  
