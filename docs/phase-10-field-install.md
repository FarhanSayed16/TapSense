# Phase 10 — Field Install & Calibration Runbook

**Goal:** Sensors live on 3 real taps, sealed, calibrated, logging to the admin dashboard.  
**Prereq:** Phase 9 bench gate (firmware + MQTT/HTTP proven). Phase 1 written approval on hand.  
**Silent mode:** No LED/OLED displays yet (Phase 0 baseline). Tap A remains control forever.

---

## Packing list (bring to site)

| Item | Qty | Packed? |
|---|---|---|
| ESP32 with firmware uploaded + config.h WiFi set | 1 | [ ] |
| YF-S201 sensors | 3 | [ ] |
| IP enclosure + cable glands / seals | 1+ | [ ] |
| 5V power supply / reliable USB adapter | 1 | [ ] |
| Pipe fittings / adapters matched to taps | as needed | [ ] |
| PTFE tape | 1 | [ ] |
| Towels / bucket (1–5 L marked) | 1 | [ ] |
| Phone hotspot backup (if campus WiFi flaky) | — | [ ] |
| Laptop with Serial + dashboard access | 1 | [ ] |
| Printed approval + this runbook | 1 | [ ] |
| Labels: Tap A / B / C | 3 | [ ] |

---

## 10.1 Pre-install

- [ ] Confirm **written** facilities/warden sign-off (`docs/phase-1-facilities-proposal.md`)
- [ ] Confirm site lock still matches reality (`docs/phase-1-site-lock.md`) — Tap A/B/C positions
- [ ] Schedule **water shutoff window** with facilities · date/time: _______________
- [ ] Confirm who opens/closes main valve: _______________ · phone: _______________
- [ ] Leak emergency contact on site: _______________
- [ ] Phone WiFi test at install height · SSID: _______________ · OK?: Yes / No
- [ ] If WiFi weak: plan documented below before leaving

### WiFi fallback (if campus WiFi fails)
1. Try closer AP / 2.4 GHz only / known hostel SSID  
2. Temporary phone hotspot → update `WIFI_SSID` / password · re-upload  
3. Last resort: SD-buffer plan (not in MVP firmware yet) — **do not leave** a non-logging install; reschedule  

Fallback chosen: _______________

---

## 10.2 Mechanical install

1. [ ] Shut water · open tap to depressurize  
2. [ ] Install **Tap A** sensor inline — flow **arrow** with water · PTFE on threads  
3. [ ] Install **Tap B**, then **Tap C** the same way  
4. [ ] Labels on pipe/wall: A (control) · B · C  
5. [ ] Mount ESP in **IP box**, above splash, out of easy reach  
6. [ ] Wire: A→GPIO27 · B→GPIO26 · C→GPIO25 · shared 5V/GND · strain relief · short runs  
7. [ ] Close enclosure; glands sealed  
8. [ ] Repressurize · wipe dry · watch joints **2–3 minutes**  
9. [ ] **No active leaks** before leaving the area  

Leak notes: _______________

---

## 10.3 Power & network

- [ ] Stable 5V power connected  
- [ ] Serial (or dashboard) shows WiFi connected  
- [ ] MQTT or HTTP ingest reaching backend (`last_seen` updates)  
- [ ] Type Serial `status` → wifi=up mqtt=up (or HTTP enabled)  

---

## 10.4 Calibration (bucket test)

Use worksheet: `docs/phase-10-calibration-sheet.md`

For **each** tap A, B, C:

1. [ ] Collect known volume (recommend **2 L** or **5 L** marked bucket)  
2. [ ] Note pulses from Serial during fill **or** compute from liters shown vs true volume  
3. [ ] New `pulses_per_liter = pulses_counted / liters_true`  
   - Or if using dashboard liters with old cal:  
     `new_ppl = old_ppl * (liters_reported / liters_true)`  
4. [ ] Update **firmware** `config.h` (`PULSES_PER_LITER_A/B/C`) · re-upload  
5. [ ] Update **backend** via script or API (below)  
6. [ ] Re-run one known volume · error within **±10%**  

### Update backend calibration (laptop on site WiFi)

```powershell
cd backend
.\.venv\Scripts\python -m scripts.set_calibration --tap tap_a --ppl 455
.\.venv\Scripts\python -m scripts.set_calibration --tap tap_b --ppl 448
.\.venv\Scripts\python -m scripts.set_calibration --tap tap_c --ppl 460
```

Or: `PATCH /api/v1/taps/{tap_id}/calibration` with admin JWT · body `{"pulses_per_liter": 455}`

---

## 10.5 Field verification

- [ ] Open **Tap A** briefly → Overview / tap detail shows **tap_a** only  
- [ ] Open **Tap B** → **tap_b** only  
- [ ] Open **Tap C** → **tap_c** only  
- [ ] Tap A shows **Control** badge in UI  
- [ ] Device page: status online · last-seen fresh  
- [ ] After-install photos saved: _______________  
- [ ] Facilities notified install complete  

---

## Phase 10 gate

- [ ] **24 hours** continuous run  
- [ ] No active leaks on revisit  
- [ ] Logging continuous (no long offline gaps)  
- [ ] Calibration values recorded on sheet  

**Gate signed:** _______________ **Date:** _______________

→ Then start **Phase 11** (10–14 day silent baseline). Do **not** add displays yet.
