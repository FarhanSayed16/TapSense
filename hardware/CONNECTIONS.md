# TapSense Pilot — Wiring Cheat-Sheet

**Full plan:** [`HARDWARE-BUILD-PLAN.md`](./HARDWARE-BUILD-PLAN.md)  
**Use now:** `firmware/tapsense_bench/` (USB + LCD)  
**Later:** `firmware/tapsense_pilot/` (Wi‑Fi + MQTT)

---

## Board labels → software

| Pipe | Tap ID | Role | GPIO |
|---|---|---|---|
| **1** | `tap_a` | Control | **25** |
| **2** | `tap_b` | Intervention | **26** |
| **3** | `tap_c` | Intervention | **27** |

---

## Power (L7805CV)

| 7805 pin | Connect |
|---|---|
| 1 INPUT | Barrel **+** (9–12 V) |
| 2 GND | Barrel **−** + system GND |
| 3 +5 V OUT | Sensor reds + LCD VCC |

ESP32: USB while developing. Common GND required.

---

## YF-S201

| Wire | To |
|---|---|
| Red | +5 V |
| Black | GND |
| Yellow | GPIO 25 / 26 / 27 (A / B / C) |

---

## 16×2 LCD (I2C)

| Pin | To |
|---|---|
| GND | GND |
| VCC | +5 V |
| SDA | GPIO **21** |
| SCL | GPIO **22** |

Address usually `0x27` (try `0x3F` if blank).
