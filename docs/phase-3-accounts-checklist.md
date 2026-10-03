# Phase 3 — Accounts & Services Checklist

Create these once. Put real passwords only in a password manager — **never in git**.

Copy this file to `docs/phase-3-credentials.local.md` (gitignored) if you want local notes.

---

## MongoDB Atlas

- [ ] Account created  
- [ ] Cluster created (suggested name: `tapsense-pilot`)  
- [ ] Database user created  
- [ ] Network access: allow your IP (or `0.0.0.0/0` only for early pilot, tighten later)  
- [ ] Connection string copied into `backend/.env` as `MONGODB_URI`  
- [ ] Database name: **`tapsense`** (locked)

**URI shape:** `mongodb+srv://USER:PASS@CLUSTER.mongodb.net/?retryWrites=true&w=majority`

Local alternative for Phase 4 only: `mongodb://localhost:27017` if Mongo runs on your PC.

---

## MQTT broker

**Pilot default (no signup):** HiveMQ public `broker.hivemq.com:1883`  
- [ ] Confirmed reachable from your PC  
- [ ] Same host/topic in `backend/.env` and `firmware/.../config.h`

**Optional private (better later):**
- [ ] HiveMQ Cloud free / self-hosted Mosquitto  
- [ ] Username + password set in both backend and firmware  

Topic (locked): `tapsense/pilot/device_01/telemetry`

---

## Render (FastAPI) — placeholder OK for Phase 3

- [ ] Render account created  
- [ ] Web Service placeholder named `tapsense-api` (can deploy empty/health in Phase 4)  
- [ ] Note dashboard URL: _______________  

---

## Vercel (Next.js) — placeholder OK for Phase 3

- [ ] Vercel account created  
- [ ] Project placeholder named `tapsense-web`  
- [ ] Note dashboard URL: _______________  

---

## Credentials hygiene

- [ ] Password manager entry “TapSense pilot” created  
- [ ] Stores: Atlas URI, MQTT (if private), JWT_SECRET, DEVICE_API_KEY, admin password  
- [ ] Confirmed `.env` / `.env.local` are gitignored  

Generate strong locals for Phase 4+:

```
JWT_SECRET=          (long random)
DEVICE_API_KEY=      (long random)
```

---

## Phase 3 accounts gate

- [ ] Mongo reachable (Atlas or local) — *required before Phase 5 seed*  
- [ ] MQTT host decided and written in conventions  
- [ ] Render + Vercel accounts exist (deploy can wait until Phase 4/8)
