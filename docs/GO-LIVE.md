# Go live — ESP → dashboard

Bench (USB/LCD) is done. Next: **Wi‑Fi pilot firmware** so taps appear on the admin Overview.

```
YF-S201 → ESP32 → Wi‑Fi → your PC API (:8000) → Mongo Atlas → http://localhost:3000
                         ↘ MQTT (HiveMQ) ↗
```

For the first live link we use **HTTP ingest** (reliable on campus Wi‑Fi). MQTT stays on as a second path.

---

## 0. Prove the dashboard (no ESP)

With API + frontend running:

```powershell
cd d:\TapSense\backend
.\.venv\Scripts\python -m scripts.simulate_ingest
```

Refresh Overview — you should see liters / sessions / `device_01` online briefly.

---

## 1. Run API so the ESP can reach it

ESP cannot talk to `127.0.0.1`. Bind to all interfaces:

```powershell
cd d:\TapSense\backend
.\.venv\Scripts\uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Your PC Wi‑Fi IP right now is typically **`192.168.0.100`** (check with `ipconfig` if login fails from ESP).

Allow inbound TCP **8000** in Windows Firewall if the ESP cannot connect.

Frontend (second terminal):

```powershell
cd d:\TapSense\frontend
npm run dev
```

Login: `admin@tapsense.app` / `TapSenseAdmin123!`

---

## 2. Edit pilot Wi‑Fi (required)

Open the single file `firmware/tapsense_pilot/tapsense_pilot.ino` and edit the SETTINGS block at the top (`WIFI_SSID` / `WIFI_PASSWORD`). HTTP URL and API key are already set there.

If your PC IP changed, update `HTTP_INGEST_URL` in that same file.

Arduino libraries: **PubSubClient** (+ WiFi/HTTP built into ESP32 core).

---

## 3. Upload `tapsense_pilot` (not bench)

1. Open `firmware/tapsense_pilot/tapsense_pilot.ino`
2. Board: **ESP32 Dev Module** · Serial **115200**
3. Upload (USB can stay plugged for Serial logs)
4. Watch Serial:

```
[wifi] ok ip=...
[http] ... 200   (or mqtt publish lines)
```

5. `sim a 450` in Serial → Overview should move for **tap_a** without water.

6. Open each faucet alone → that tap’s card / sessions update.

---

## 4. Live checklist

| Check | OK when |
|---|---|
| API health | `mongo:true` at `/api/v1/health` |
| ESP Wi‑Fi | Serial shows `ip=` |
| Ingest | Serial shows HTTP 200 or MQTT publish |
| UI | Overview liters / device last seen refresh |
| IDs | Pipe 1=`tap_a`, 2=`tap_b`, 3=`tap_c` only |

---

## 5. After go-live

- Bucket-calibrate `PULSES_PER_LITER_*` (Phase 10)
- Keep LCD on **bench** sketch for local display, or add LCD later to pilot
- Silent baseline: leave control tap without public live feedback

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| Wi‑Fi fail | 2.4 GHz SSID; correct password; not captive portal |
| HTTP timeout | API on `0.0.0.0`; same Wi‑Fi as ESP; firewall 8000; correct PC IP |
| 401 from ingest | `DEVICE_API_KEY` must match `.env` |
| UI empty | Hard refresh; confirm login; run `simulate_ingest` once |
| MQTT only, no HTTP | Fine if backend log shows `mqtt ingest` — both paths OK |
