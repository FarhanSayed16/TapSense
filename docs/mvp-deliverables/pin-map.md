# MVP Deliverable — Pin Map

| Function | ESP32 GPIO | Wire | Software ID |
|---|---|---|---|
| Tap A pulse (control) | 27 | YF-S201 SIG | `tap_a` |
| Tap B pulse | 26 | YF-S201 SIG | `tap_b` |
| Tap C pulse | 25 | YF-S201 SIG | `tap_c` |
| Sensor VCC (shared) | 5V | Red | — |
| Sensor GND (shared) | GND | Black | — |
| Optional OLED SDA (Phase 1+) | 21 | I2C | B/C display only |
| Optional OLED SCL (Phase 1+) | 22 | I2C | B/C display only |
| Optional WS2812 DIN (Phase 1+) | 13 | Data | B/C only — never A |

Device ID: `device_01`  
MQTT topic: `tapsense/pilot/device_01/telemetry`  

Full wiring: `firmware/CONNECTIONS.md`
