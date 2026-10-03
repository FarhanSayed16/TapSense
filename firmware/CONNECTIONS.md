# TapSense Pilot — Wiring Cheat-Sheet

**Full plan:** [`../hardware/HARDWARE-BUILD-PLAN.md`](../hardware/HARDWARE-BUILD-PLAN.md)  
**Use now:** `tapsense_bench/` · **Later:** `tapsense_pilot/`

| Pipe | Tap ID | GPIO |
|---|---|---|
| 1 | `tap_a` control | **25** |
| 2 | `tap_b` | **26** |
| 3 | `tap_c` | **27** |
| LCD SDA/SCL | | **21** / **22** |

YF-S201: Red→5V, Black→GND, Yellow→GPIO. ESP32 USB for bench.
