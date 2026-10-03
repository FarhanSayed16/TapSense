# Phase 10 — Bucket Calibration Sheet

Fill one row per tap. Keep with install photos.

**Date:** _______________ **Site:** _______________ **Operator:** _______________

Default factory guess: **450 pulses/L**. Replace after this test.

---

## Method

1. Note current `pulses_per_liter` in firmware/backend (usually 450).  
2. Run exact volume into marked bucket (2 L or 5 L).  
3. From Serial pulse count **or** adjust using reported liters:

\[
ppl_{new} = ppl_{old} \times \frac{L_{reported}}{L_{true}}
\]

4. Update firmware + backend.  
5. Repeat one check volume; accept if within ±10%.

---

## Tap A — control (`tap_a` · GPIO 27)

| Field | Value |
|---|---|
| True volume (L) | |
| Old PPL | |
| Pulses counted (if known) | |
| Liters reported (dashboard/Serial) | |
| **New PPL** | |
| Check volume (L) | |
| Check reported (L) | |
| Error % | |
| Pass ±10%? | Yes / No |
| Backend updated? | [ ] |
| Firmware re-uploaded? | [ ] |

---

## Tap B — intervention (`tap_b` · GPIO 26)

| Field | Value |
|---|---|
| True volume (L) | |
| Old PPL | |
| Pulses counted (if known) | |
| Liters reported | |
| **New PPL** | |
| Check volume (L) | |
| Check reported (L) | |
| Error % | |
| Pass ±10%? | Yes / No |
| Backend updated? | [ ] |
| Firmware re-uploaded? | [ ] |

---

## Tap C — intervention (`tap_c` · GPIO 25)

| Field | Value |
|---|---|
| True volume (L) | |
| Old PPL | |
| Pulses counted (if known) | |
| Liters reported | |
| **New PPL** | |
| Check volume (L) | |
| Check reported (L) | |
| Error % | |
| Pass ±10%? | Yes / No |
| Backend updated? | [ ] |
| Firmware re-uploaded? | [ ] |

---

## Final values (copy into `config.h`)

```
PULSES_PER_LITER_A = ________
PULSES_PER_LITER_B = ________
PULSES_PER_LITER_C = ________
```

**Notes / anomalies:**  
_______________________________________________
