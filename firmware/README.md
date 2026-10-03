# TapSense firmware

Two sketches — use them in order.

| Folder | When | Needs |
|---|---|---|
| **`tapsense_bench/`** | **Now** — prove sensors + LCD over USB | `LiquidCrystal_I2C` |
| **`tapsense_pilot/`** | After bench works — send data to cloud | `PubSubClient` + Wi‑Fi |

## Pin map (locked)

| Pipe | ID | GPIO |
|---|---|---|
| 1 | `tap_a` (control) | **25** |
| 2 | `tap_b` | **26** |
| 3 | `tap_c` | **27** |
| LCD SDA / SCL | | **21** / **22** |

## Bench (do this first)

1. Arduino IDE → open `tapsense_bench/tapsense_bench.ino`
2. Board: **ESP32 Dev Module** · baud **115200**
3. Library Manager: install **LiquidCrystal_I2C**
4. Wire per `../hardware/HARDWARE-BUILD-PLAN.md`
5. Upload → Serial Monitor → `sim a 450` → LCD + Serial should move
6. Open each faucet alone; only that tap’s liters rise

If LCD stays blank, try `LCD_ADDRESS` `0x3F` instead of `0x27`.

## Pilot (Wi‑Fi → live dashboard)

After bench passes, follow **`docs/GO-LIVE.md`**.

1. Edit Wi‑Fi at the top of `tapsense_pilot/tapsense_pilot.ino` (single file)
2. API: `uvicorn app.main:app --host 0.0.0.0 --port 8000`
3. Upload that sketch (PubSubClient library)
4. Open a tap → Overview updates
