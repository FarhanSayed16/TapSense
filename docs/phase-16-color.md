# Phase 16 — Product Phase 2 Loss-Aversion Color

**Goal:** Wordless green→amber→red cue on intervention taps only. Impersonal totals. No guilt text.

**Science note:** Build and demo the path now. Measure marginal effect vs Phase 1 only after real field windows.

---

## Rules (locked)

1. Color cues on **Tap B and Tap C only**  
2. **Tap A never** gets LED / LCD band / visibility color  
3. Config stores **ratios + band ratios only** — no scold strings  
4. Default bands: green &lt; 1.0× threshold · amber &lt; 1.5× · else red  

---

## What shipped

| Layer | Behavior |
|---|---|
| API | `GET/PATCH /api/v1/thresholds` · `POST /thresholds/suggest` · `GET /thresholds/live` |
| Visibility | `/visibility/live` includes `band` when product phase ≥ 2 |
| Admin UI | `/thresholds` editor + band preview · Settings Phase 2 · tap chart overlay |
| Firmware | `PRODUCT_PHASE_DISPLAY=2` → LCD shows `G/A/R` on B/C; optional WS2812 (`USE_COLOR_LED`) |

---

## Enable Phase 2

### A. Suggest thresholds
1. Tag Phase 0/1 dates on `/phases` (optional).  
2. `/thresholds` → pick window → **Preview medians** → **Apply suggestions**.  
3. Mirror B/C values into firmware `COLOR_THRESHOLD_B` / `COLOR_THRESHOLD_C`.

### B. Dashboard
Settings → **Phase 2 — Color**.

### C. Firmware
```cpp
const int PRODUCT_PHASE_DISPLAY = 2;
const float COLOR_THRESHOLD_B = 1.5f;  // match admin
const float COLOR_THRESHOLD_C = 1.5f;
#define USE_COLOR_LED 0   // set 1 if WS2812 on GPIO13 + Adafruit NeoPixel installed
```

Upload. Confirm LCD never shows Tap A liters/band.

### D. Optional wall display
Open `/visibility` — B/C cards tint green/amber/red by band.

---

## Verification checklist

- [ ] Control Tap A has no threshold enable / no color on visibility  
- [ ] Suggest→apply writes median thresholds for B/C  
- [ ] Phase 2 Settings toggle sets `color_enabled`  
- [ ] `/visibility` bands change as session liters cross threshold  
- [ ] Firmware LCD shows `G`/`A`/`R` next to TAP 2/3 only  
- [ ] Tap detail chart shows dashed threshold overlay for B/C  

---

## Field gate (later)

- Collect marginal effect vs Phase 1  
- Fill `docs/phase-16-report-template.md`  
- Control must remain uncued in the field note  
