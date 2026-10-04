# TapSense Pilot — One-pager (faculty)

## Problem
Campus washrooms waste water through long, unnoticed tap use. Typical campaigns use guilt posters; they rarely measure real behavior or protect a scientific **control**.

## Approach
**TapSense** logs water use at the **tap level** (no person IDs) in one hostel washroom.

| Tap | Role |
|---|---|
| Tap A (pipe 1) | **Control** — measured only; no intervention UI |
| Tap B / Tap C | **Intervention** — ready for later feedback (Phase 1+) |

**Phase 0 (now):** silent baseline logging — establish normal use before any behavior change.

## What is built (live pilot)
```
3× YF-S201 flow sensors → ESP32 (Wi‑Fi)
        → FastAPI + MongoDB Atlas (+ Redis)
        → Admin dashboard (Glacier Ops)
```

- Live liters / sessions / daily totals  
- Device online status  
- Admin monitoring only (not student-facing guilt screens yet)

## Demo proof points
1. Device **online** on Overview  
2. Open a tap → liters update in seconds  
3. Tap A and Tap B are **independent**  
4. Sessions list stores closed events  

## Honest limits (say these)
- Pilot scale: **1 ESP · 3 taps · 1 zone**  
- Liters use initial ~450 pulses/L until bucket calibration  
- Laptop/API must stay on the same Wi‑Fi for HTTP ingest  
- Full campus rollout is a later master plan — after baseline GO  

## Stack (engineering)
ESP32 · MQTT/HTTP ingest · FastAPI · MongoDB Atlas · Next.js admin UI

## Status
Software pilot **live**. Next field steps: calibrate → 10–14 day silent baseline → Phase 1 intervention only if GO.

**Contact / repo:** local TapSense project · admin `admin@tapsense.app`
