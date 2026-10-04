# Phase 13 — Product Phase 1 Visibility

**Goal:** Show **numbers only** on intervention taps (B & C). Tap A (control) stays sensor-only — no user-facing liters.

**Science note:** You can build and demo this software/hardware path now. Do **not** claim Phase 1 effect sizes until a real Phase 0 baseline window exists.

---

## Rules (locked)

1. Live liters on **Tap B and Tap C only**  
2. **Tap A never** gets LCD / visibility page / guilt text  
3. Same MQTT/HTTP logging for all three taps (measurement unchanged)  
4. Admin Overview phase pill = **Phase 1 — Visibility** when enabled  

---

## What we ship in-repo

| Layer | Behavior |
|---|---|
| Mongo `pilot_settings` | `product_phase`: `0` or `1` (admin toggle) |
| API | `GET/PATCH /api/v1/product-phase` · phase on Overview |
| Firmware | `PRODUCT_PHASE_DISPLAY = 1` → LCD rotates **B/C only** (+ ONLINE status) |
| Admin UI | Phase pill, Phase 1 explainer, Settings toggle |
| `/visibility` | Large B/C live liters (phone/tablet near washroom) |

Field OLED/WS2812 per tap remains optional later (same rule: never on A).

---

## Enable Phase 1

### A. Dashboard
Settings → **Product phase** → switch to **Phase 1 — Visibility**.

### B. Firmware
In `tapsense_pilot.ino` SETTINGS:

```cpp
const int PRODUCT_PHASE_DISPLAY = 1;  // 0 = silent LCD (status only); 1 = show B/C liters
```

Upload. Confirm LCD never shows `TAP 1` / control liters.

### C. Optional wall display
Open http://localhost:3000/visibility (while logged in) on a phone/tablet near B/C.

---

## Verification checklist

- [ ] Phase pill on Overview = Phase 1 — Visibility  
- [ ] Open Tap B → LCD and/or `/visibility` rise; dashboard `tap_b` matches ≈  
- [ ] Open Tap C → same for `tap_c`  
- [ ] Open Tap A → dashboard updates; **no** user liters on LCD / visibility page  
- [ ] Settings can return to Phase 0 (admin UI) without wiping data  

---

## Field science (later)

1. Finish Phase 0 baseline window  
2. Enable Phase 1 for a comparable weekday set  
3. Fill `docs/phase-13-report-template.md` (Δ session L, Δ long-tail)  
4. Gate: document ~5–10% change **or** null result before Phase 16 color  

---

## Status

See `docs/phase-13-status.md`.
