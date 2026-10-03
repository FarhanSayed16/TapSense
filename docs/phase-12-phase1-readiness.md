# Phase 12 Stretch — Product Phase 1 Readiness (Visibility)

**Only if Phase 11 baseline note = GO.**

## Rules
- Live liter feedback on **Tap B and Tap C only**  
- **Tap A (control) stays blank** — no OLED/LED  
- No guilt text — numbers only  
- Keep logging identical for science (same MQTT path)

## Hardware add-on
| Item | Qty | Notes |
|---|---|---|
| 0.96" OLED (I2C) or WS2812 | 1–2 | Mount at B and/or C |
| Wiring | — | SDA=21 SCL=22 (OLED) or DIN=13 (WS2812) |

## Firmware
In `firmware/tapsense_pilot/config.h`:

```cpp
static const bool DISPLAY_ENABLED = true;  // was false for Phase 0/11
```

Rebuild/upload. When enabled, firmware shows **session liters for B and C** on Serial always, and on OLED if `DISPLAY_OLED` is compiled (see sketch).

Tap A session liters are never pushed to a user-facing display path.

## Verification
- [ ] Open B → display/Serial shows rising liters; dashboard `tap_b` matches ≈  
- [ ] Open C → same for `tap_c`  
- [ ] Open A → dashboard updates; **no** user display  
- [ ] Plan same-tap / same-weekday % change vs Phase 0 for report  

## Compare plan (for later report)
For each of B and C: pick matching weekdays Phase 0 vs Phase 1 windows → Δ mean session L and Δ long-tail frequency (`baseline_report` style windows).
