# Phase 8 — Frontend MVP Pages Wired (Status)

**Goal:** Admin monitoring UI against live B1 APIs.

## Done

### 8.1 Login
- Brand-forward `/login`, errors via toast, session restore via `AuthProvider`

### 8.2 Overview `/`
- Live crumb from overview location
- KPIs: today / week / active sessions / device status
- Tap strip with control badge + today’s liters
- 7-day mini bar chart
- Phase 0 badge
- Empty / error / loading states

### 8.3 Taps `/taps`
- Table + All / Control / Intervention filters
- Row → `/taps/[tapId]`

### 8.4 Tap detail `/taps/[tapId]`
- Header, badges, KPIs, 7d/14d chart, sessions, calibration, device link

### 8.5 Sessions `/sessions`
- Tap + date filters, long-tail column, empty copy

### 8.6 Device `/device`
- Id, status, last seen, firmware, bound taps, stale callout (no commands)

### 8.7 Settings
- Profile + logout

### 8.8 Quality
- Skeletons, error+retry, no fake numbers, tap-level language only
- [ ] Vercel ↔ Render deploy — **your accounts** (local verified)

## Gate
- [x] Login + seeded taps visible locally
- [x] Simulated ingest data shows on Overview / Sessions / charts (`npm run build` OK)

## Run
```powershell
# terminal 1 — API + Mongo
cd backend
.\.venv\Scripts\uvicorn app.main:app --reload --port 8000

# optional refresh demo data
.\.venv\Scripts\python -m scripts.simulate_ingest

# terminal 2
cd frontend
npm run dev
```
http://localhost:3000/login · `admin@tapsense.app` / `TapSenseAdmin123!`

## Next → Phase 9
Firmware bench with real sensors (code already in `firmware/`).
