# TapSense Pilot — Complete Hardware Build & Wiring Plan

**Your setup (from photos):** 3× PVC taps + YF-S201 · 1× ESP32 DevKit · 16×2 LCD (I2C) · L7805CV 5 V regulator · DC barrel jack  
**Firmware now:** `firmware/tapsense_bench/` (USB + LCD, no Wi‑Fi)  
**Firmware later:** `firmware/tapsense_pilot/` (Wi‑Fi + MQTT → cloud)  
**Goal:** Clean wiring so pipe **1 / 2 / 3** → `tap_a` / `tap_b` / `tap_c`, prove on Serial/LCD first, then cloud.

---

## 0. What you have vs what we will do

| Item | Status in photos | Action |
|---|---|---|
| 3× PVC + faucet + YF-S201 | Mounted, labeled 1–2–3 | Keep plumbing; only rewire electronics |
| ESP32 | Mounted, often unpowered/unwired | Wire pins per table below |
| 16×2 LCD + I2C backpack | Mounted; 4 wires loose | Wire to I2C (GPIO 21/22) |
| L7805CV | Hand-wired; messy tab solder; two black leads | Rebuild clean 5 V rail |
| DC barrel jack | Present, often disconnected | Feed regulator only |
| Jumpers | Tangled | Tear down → rebuild once |

**Do not use Docker for hardware.** Laptop USB programs the ESP32; Atlas/Upstash stay in the cloud.

---

## 1. Physical tap map (lock this forever)

Label on the board = TapSense ID = GPIO.

| Board label | Role | Tap ID | ESP32 GPIO | Sensor signal wire |
|---|---|---|---|---|
| **1** (left) | **Control** | `tap_a` | **GPIO 25** | Yellow |
| **2** (middle) | Intervention | `tap_b` | **GPIO 26** | Yellow |
| **3** (right) | Intervention | `tap_c` | **GPIO 27** | Yellow |

Tape on each yellow wire: `A-25`, `B-26`, `C-27`. Wrong labels ruin the science (control vs intervention).

**Bench note:** LCD may show all taps while you debug over USB. For the real silent baseline, switch to pilot firmware and keep control feedback off.

---

## 2. Power architecture (do this first)

### 2.1 Why the 7805 exists

- Barrel jack → ~9–12 V DC (typical wall adapter)  
- **L7805CV** → clean **5 V** for sensors + LCD  
- ESP32 logic stays **3.3 V** (board regulator from USB or VIN)

```
  Wall adapter (9–12 V DC, centre-positive preferred)
           │
           ▼
     DC barrel jack
       + ─────► L7805 PIN1 (INPUT)
       − ─────► L7805 PIN2 (GND) ─── common GND bus
                       │
                       ▼
                 L7805 PIN3 (OUTPUT = +5 V)
                       │
          ┌────────────┼────────────────┐
          ▼            ▼                ▼
     YF-S201 ×3     LCD I2C VCC     (optional ESP VIN*)
     (red wires)

  * Prefer: ESP32 powered by USB while developing.
    Only use VIN from regulated 5 V if the DevKit accepts it.
    Never put 9–12 V on VIN or 3V3.
```

### 2.2 L7805 pinout (facing the writing, tab away from you)

| Pin | Name | Wire colour (recommended) | Connects to |
|---|---|---|---|
| 1 (left) | INPUT | **Red** | Barrel jack **+** |
| 2 (centre) | GND | **Black** | Barrel jack **−** + system GND |
| 3 (right) | OUTPUT +5 V | **Orange or yellow** (not black) | +5 V rail |

Your photo shows **black on both pin 2 and pin 3** — that invites mistakes. **Re-solder pin 3 with a different colour** (orange/yellow).

### 2.3 Capacitors (strongly recommended)

| Cap | Where |
|---|---|
| 100 nF – 330 nF ceramic | INPUT → GND (close to 7805) |
| 100 nF ceramic | OUTPUT → GND (close to 7805) |
| Optional 10–47 µF electrolytic | OUTPUT → GND (bulk) |

### 2.4 Tab solder blob

On TO-220 **L7805**, the metal tab is internally tied to **GND**. Extra solder on the tab is ugly but OK **only if** it does not short to pin 1 or pin 3. Clean shorts with braid if needed. Mount with a screw to the board if you want a heat path; for short bench runs it can hang with short leads.

### 2.5 Ground rule (critical)

**One common GND** tying together:

- Barrel jack −  
- 7805 pin 2  
- All 3 sensor black wires  
- LCD I2C GND  
- ESP32 **GND** (any GND pin)

Without common GND, pulses and I2C will glitch or read nothing.

### 2.6 Safe power-up order

1. Build 5 V rail with ESP32 **unplugged**.  
2. Measure with multimeter: **OUTPUT ≈ 4.8–5.2 V**, GND to GND.  
3. Only then connect sensors/LCD, then plug ESP32 USB.  
4. Never feed **9–12 V** into ESP32 **3V3** or sensor VCC.

---

## 3. Flow sensor wiring (YF-S201)

Each sensor cable:

| Wire | Function | Goes to |
|---|---|---|
| **Red** | VCC | Shared **+5 V** (7805 output) |
| **Black** | GND | Shared **GND** |
| **Yellow** | Pulse (open-collector style) | One GPIO only (see §1) |

### 3.1 Shared power bus (clean method)

On a small terminal block or solder pads:

1. All **3 reds** → +5 V  
2. All **3 blacks** → GND  
3. Yellows stay **separate** → 25 / 26 / 27  

Do **not** join yellow wires together.

### 3.2 Why INPUT_PULLUP is OK

Firmware uses `INPUT_PULLUP` + falling-edge ISR. The sensor pulls the line low on each pulse; the ESP32 pull-up holds ~3.3 V high. That keeps GPIO levels safe even when the sensor is powered from 5 V.

### 3.3 Wire length

Keep yellow leads as short as practical on the board. Twist each yellow lightly with its black return if noise appears.

---

## 4. ESP32 pin map (complete)

Use the **right-side / labeled** pins on a typical 30-pin DevKit (your board shows VIN, GND, D13…D34 on one rail).

| Function | GPIO / rail | Notes |
|---|---|---|
| Tap A pulse | **D25** | Pipe **1** · control |
| Tap B pulse | **D26** | Pipe **2** |
| Tap C pulse | **D27** | Pipe **3** |
| LCD SDA | **D21** | I2C data |
| LCD SCL | **D22** | I2C clock |
| Common GND | **GND** | Must share with 7805 |
| Logic power (dev) | **USB** | Preferred while coding |
| Optional board power | **VIN** | Only from **regulated 5 V**, never raw barrel |

**Do not use for sensors:** GPIO 6–11 (flash), avoid 0 / 2 / 15 for pulse inputs.

```
                    +5 V (7805 out)
                      │
     ┌────────────────┼────────────────┐
     │                │                │
  YF-1 RED         YF-2 RED         YF-3 RED
  YF-1 BLK ──┐     YF-2 BLK ──┐     YF-3 BLK ──┐
             └───────┬────────┴────────┬───────┘
                     │ GND             │
                     │                 │
              ESP32 GND            LCD GND
                     │
              LCD VCC ─────────── +5 V
              LCD SDA ─────────── GPIO 21
              LCD SCL ─────────── GPIO 22

  YF-1 YEL ────────── GPIO 25   (tap_a / pipe 1)
  YF-2 YEL ────────── GPIO 26   (tap_b / pipe 2)
  YF-3 YEL ────────── GPIO 27   (tap_c / pipe 3)
```

---

## 5. 16×2 LCD (I2C backpack) wiring

Your backpack has 4 pins. Match **silkscreen on the backpack**, not wire colour (colours in photos vary).

| Backpack pin | Connect to |
|---|---|
| **GND** | System GND |
| **VCC** | +5 V (7805) |
| **SDA** | ESP32 **GPIO 21** |
| **SCL** | ESP32 **GPIO 22** |

### 5.1 Firmware note (important)

Current MVP firmware is built for **OLED optional** (`TAPSENSE_DISPLAY_OLED`) and `DISPLAY_ENABLED = false` for silent baseline. Your panel is a **character LCD**, not SSD1306.

For Phase 0 / baseline:

1. Still wire the LCD if you want the hardware finished.  
2. Leave `DISPLAY_ENABLED = false` so **tap_a (control) never gets user feedback**.  
3. Later (Phase 1+): add a LiquidCrystal_I2C sketch path that shows **only tap_b / tap_c** liters — never control liters.

I2C address is often `0x27` or `0x3F`. After wiring, run an I2C scanner sketch once if the screen stays blank (also check backpack contrast pot).

---

## 6. Tear-down → rebuild sequence (follow in order)

### Step A — Power off

1. Unplug USB from ESP32.  
2. Unplug wall adapter from barrel jack.  
3. Remove the tangled jumper nest.

### Step B — Fix regulator

1. Confirm pin 1 = red from barrel **+**.  
2. Pin 2 = black to barrel **−** and GND bus.  
3. Pin 3 = **new non-black** wire to +5 V bus.  
4. Add input/output caps if available.  
5. Power barrel only → measure 5 V → unplug.

### Step C — Sensor power bus

1. Join 3× red → +5 V.  
2. Join 3× black → GND.  
3. Label yellows A/B/C.

### Step D — Pulse wires

1. Pipe 1 yellow → GPIO **25**.  
2. Pipe 2 yellow → GPIO **26**.  
3. Pipe 3 yellow → GPIO **27**.  
4. ESP32 GND → GND bus.

### Step E — LCD

1. GND / VCC / SDA / SCL as §5.  
2. Route wires under the board edge so they do not snag faucets.

### Step F — Strain relief

1. Hot-glue or zip-tie sensor cables near clamps.  
2. Keep USB cable free for programming.

### Step G — First electrical test (no water)

1. USB → ESP32; Serial 115200.  
2. Upload **`tapsense_bench`** (not pilot yet).  
3. Type `pins` → confirm **25 / 26 / 27**.  
4. `sim a 450` / `sim b 450` / `sim c 450` → Serial + LCD update.  
5. Power 5 V rail; spin/open each tap **alone** → only that channel rises.  
6. When that works → Wi‑Fi in `tapsense_pilot` + cloud.

### Step H — Water test (careful)

1. Dry electronics; board upright/stable.  
2. Open **one** faucet at a time over a bucket.  
3. Confirm liters increase only for that tap ID.  
4. Never leave the board where a leak can drip on the ESP32/LCD.

---

## 7. Firmware config checklist

Edit `firmware/tapsense_pilot/config.h` before field use:

| Setting | Value |
|---|---|
| `WIFI_SSID` / `WIFI_PASSWORD` | Your campus/hotspot Wi‑Fi |
| `MQTT_HOST` | `broker.hivemq.com` (or your broker) |
| `MQTT_TOPIC` | `tapsense/pilot/device_01/telemetry` |
| `DEVICE_ID` | `device_01` |
| `PIN_TAP_A/B/C` | 25 / 26 / 27 (already set) |
| `DISPLAY_ENABLED` | `false` for silent baseline |
| `DEVICE_API_KEY` | Same as `backend/.env` if HTTP ingest on |
| `HTTP_INGEST_URL` | Your PC LAN IP + `:8000/api/v1/ingest/telemetry` if used |

Arduino IDE: board **ESP32 Dev Module**, upload speed 115200, library **PubSubClient**.

---

## 8. End-to-end verification (hardware + cloud)

Backend must already be running against Atlas (no Docker required):

```powershell
cd d:\TapSense\backend
.\.venv\Scripts\uvicorn app.main:app --host 127.0.0.1 --port 8000
```

Health:

```powershell
Invoke-RestMethod http://127.0.0.1:8000/api/v1/health
```

On ESP32 Serial Monitor:

1. Wi‑Fi connected.  
2. MQTT connected / publishing.  
3. Open pipe 1 → messages show `tap_a` only.  
4. Pipe 2 → `tap_b`; pipe 3 → `tap_c`.  
5. Admin UI Overview (http://localhost:3000) shows three independent streams.

Gate (bench done):

- [ ] 5 V rail stable (~5 V)  
- [ ] Common GND verified  
- [ ] A/B/C not crossed  
- [ ] MQTT (or HTTP ingest) reaches Mongo `tapsense`  
- [ ] LCD wired (optional display code later)  
- [ ] No water on electronics  

---

## 9. Parts / cleanup shopping (if something is missing)

| Item | Why |
|---|---|
| Terminal block 2‑position ×2 | Clean +5 V and GND buses |
| Assorted DuPont housings | Replace bird’s-nest jumpers |
| 100 nF ceramics ×2 | 7805 bypass |
| Zip ties + heat shrink | Strain relief / colour fix on 7805 OUT |
| Small heatsink for 7805 | If adapter is warm / long runs |
| I2C level shifter (optional) | Cleaner 5 V LCD ↔ 3.3 V ESP |

---

## 10. What not to do

- Do not power sensors from **3V3** if the impeller is sticky — use **5 V** (your YF-S201 is 3.5–24 V).  
- Do not put barrel **9–12 V** on ESP32 **3V3**.  
- Do not leave **control tap (pipe 1)** on a public live-liter display during baseline.  
- Do not swap GPIO 25/26/27 after calibration without updating docs + seed mental model.  
- Do not commit Wi‑Fi passwords; keep them in local `config.h` only.

---

## 11. Related files

| File | Role |
|---|---|
| `hardware/CONNECTIONS.md` | Short pin cheat-sheet (kept in sync) |
| `firmware/BENCH.md` | Serial / `sim` bench checklist |
| `firmware/tapsense_pilot/config.h` | Wi‑Fi, MQTT, pins |
| `docs/mvp-master-execution-plan.md` | Phase context (install / baseline) |

When §8 gate is checked, you are ready for Phase 10 field install / calibration (bucket test → update `PULSES_PER_LITER_*`).
