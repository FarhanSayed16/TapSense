# Phase 9 — Firmware Bench Checklist

**Goal:** Prove 1 ESP × 3 sensors → MQTT/HTTP → Mongo → admin UI **before** plumbing.

Hardware may still be on order — you can still validate the software path with Serial `sim` commands.

---

## 9.1 Pin plan — DONE in repo

| Tap | GPIO | ID |
|---|---|---|
| A control | 27 | `tap_a` |
| B | 26 | `tap_b` |
| C | 25 | `tap_c` |
| Power | 5V + GND shared | short wires |

See `CONNECTIONS.md`.

---

## 9.2 Firmware features — DONE in repo

- [x] ISR pulse capture A/B/C  
- [x] Debounce (`PULSE_DEBOUNCE_US`)  
- [x] Pulses → liters (per-tap calibration)  
- [x] Session idle 5s (aligned with backend)  
- [x] WiFi reconnect  
- [x] MQTT publish + optional HTTP ingest fallback  
- [x] Task watchdog  
- [x] Serial debug + `sim` / `status` / `pins`  

---

## 9.3 Your bench verification (physical / serial)

### A. Prep
- [ ] Edit `tapsense_pilot/config.h` WiFi + MQTT  
- [ ] Backend running (`uvicorn` + Mongo + MQTT subscriber)  
- [ ] Admin UI at http://localhost:3000  
- [ ] Upload sketch · Serial 115200 · type `help`

### B. Without sensors (software path)
- [ ] `sim a 450` → wait ~2s → Serial shows `tap_a` publish  
- [ ] Wait ≥5s idle → session END  
- [ ] Repeat `sim b 450` and `sim c 450`  
- [ ] Dashboard Overview shows liters for all three taps  
- [ ] Confirm IDs are not crossed (A≠B≠C)

### C. With YF-S201 sensors
- [ ] Wire per `CONNECTIONS.md`  
- [ ] Blow/spin or jug-test **only Tap A** → only `tap_a` moves  
- [ ] Repeat for B, then C  
- [ ] Toggle WiFi off/on (router or ESP) → reconnect + resume  
- [ ] Leave powered 1–2 hours · no WDT reboot loop in Serial  

### D. Gate
- [ ] All 3 taps independently visible on Overview  
- [ ] No cross-wired tap IDs  

When D is checked → **Phase 9 complete** → go to Phase 10 (field install).
