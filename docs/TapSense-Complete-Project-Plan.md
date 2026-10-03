# TapSense — Complete End-to-End Project Plan
### K J Somaiya Vidyavihar University — Campus Water Behavior System

*This is the single, final reference document for the project. Every decision below is settled — nothing here is an open option to weigh, it's what to build.*

---

## 1. Executive Summary

TapSense measures water usage at college washroom taps in real time and gives people live feedback — a number and a color cue — while they're using the tap. The goal is to turn an invisible resource into one people subconsciously react to, without ever using guilt-trip text. It's built on cheap, proven hobbyist electronics (ESP32, LoRa radio, simple flow sensors), needs no custom PCB, and is designed to start small (a handful of taps in one washroom) and expand only once the data proves it works.

---

## 2. The Problem

### 2.1 Why this matters
- India holds ~18% of world population but only ~4% of global water resources; per-capita availability (~1,100 m³) sits close to the international scarcity threshold (1,000 m³).
- Consequences compound across health, agriculture, and cities (e.g. Chennai-style acute shortages).

### 2.2 The actual, addressable problem
**When resource use is invisible and free, people over-use it.** Nobody at a washroom tap knows how much water a session costs, gets feedback when a tap runs unattended, or has any comparison point for "is this normal or excessive." This is a **behavioral gap, not an awareness gap** — everyone already knows water is scarce in the abstract; nobody feels it at the sink.

### 2.3 Where this shows up on campus
- Taps left running while lathering/soaping
- No sense of quantity used per session
- No consequence structure — unlike a home water bill, a college tap gives zero individual cost feedback
- Facilities staff have no visibility into which building/department uses how much

---

## 3. Research Foundation

**Design Thinking loop:** Empathy → Define → Ideate → Prototype → Test → Implement. Used for real here — Phase 0 (below) *is* the empathy/data step, and every later phase gates on the previous one's actual test results, not assumptions.

**Fogg Behavior Model:** `Behavior = Motivation × Ability × Prompt`. All three are needed:
- **Prompt** — the display, the color cue, the leaderboard
- **Ability** — already high for most people (turning off a tap is easy); a future auto-cutoff valve is the fallback for the minority who won't self-correct
- **Motivation** — the design choice that matters most (see below)

**Key finding from the literature (Fielding 2012, Ambaum 2024, Addo 2018, Sanchez 2023):** explicit guilt/shame messaging causes **reactance** — people resent being scolded by a machine and disable or ignore it. The two levers with real evidence behind them are:
1. **Real-time visceral feedback** (loss aversion — watching a number climb triggers the same reflex guilt tries to manufacture, without the resentment)
2. **Social norm comparison** ("your block uses more than others" is one of the strongest levers in household water/energy studies)

**Final design decision:** TapSense uses both. No literal guilt text anywhere in the system.

---

## 4. The Idea — What's Being Built

A tap-mounted sensor + display that:
1. Measures liters passing through, in real time
2. Shows that number back instantly (visibility)
3. Shifts color when a session crosses a threshold (loss-aversion cue, wordless)
4. Feeds a block/washroom-level leaderboard (social norm comparison)

No per-person tracking, ever — everything is tap- and washroom-level. This is both a privacy decision and an evidence-based one: block-level comparison, not individual shaming, is what the research supports.

---

## 5. Architecture — Two Tiers, and the Final Call on Each

### Tier 1: Bulk washroom measurement (accurate totals) — **deferred, not built in the pilot**
A commercial pulse water meter on each washroom's main supply line would give an exact total for that room (all taps + flush combined), which is what "which building/department uses how much" ultimately needs. **Decision: skip this for now.** It costs ₹4,000–8,000 per washroom, needs a plumber to cut into the pipe, and doesn't test the actual hypothesis of this project (does feedback change behavior). Add it later, funded by facilities, once the pilot proves the behavior-change concept — nothing about the wiring changes when it's added, spare GPIO pins are already reserved for it.

### Tier 2: Individual tap sensors (the pilot — this is what gets built)
A small sensor + display on selected taps, giving live per-tap feedback. This is the actual project for now.

**Per washroom, per your 7-tap example: instrument 3 of the 7 taps, not all 7.** Pick the ones nearest the entrance — highest footfall, most visible. Three taps gives a real before/after comparison without tripling cost for no extra insight.

**One ESP32 per washroom — never one per tap.** A single controller box handles all 3 sensors, all 3 displays, and the radio for that entire washroom.

---

## 6. What the Two Sensor Types Actually Are

| | Bulk meter (not used in pilot) | YF-S201 (used in pilot) |
|---|---|---|
| Measures | Whole washroom, all taps combined | One single tap |
| Installed by | Plumber, cut into pipe | You, screwed onto spout |
| Cost | ₹4,000–8,000 | ₹220–280 |
| Signal type | Digital pulse (fixed volume per pulse, check datasheet) | Digital pulse (~450 pulses/liter, calibrate each unit) |
| Grade | Commercial metering instrument | Hobbyist sensor, well-proven for this use |
| Rated flow range | N/A for this project | 1–30 L/min — a hand-wash tap runs 2–8 L/min, comfortably inside range |

**Both are digital pulse outputs, not analog voltages.** A wheel spins as water flows, a magnet trips a sensor once per rotation, producing an on/off pulse train — frequency of pulses = flow rate, total pulse count = total volume. Connects straight to an ESP32 GPIO pin, counted in software. No analog-to-digital conversion needed anywhere in this design.

---

## 7. Mounting the Sensors — No Plumbing Required

Since the pilot skips the bulk meter, **nothing in this project requires cutting into a pipe.** The YF-S201 screws directly onto the tap spout, the same way the clip-on water-saving aerator nozzles you found images of attach — most tap spouts have a standard thread these fit onto (a cheap adapter may be needed; test on one tap before ordering for all). Fully removable, no plumber needed, no water shut-off needed.

*Side note, unrelated to the sensors:* those aerator nozzles themselves are a genuinely good, nearly-free (₹20–50 each) separate water-saving measure worth suggesting to facilities for every non-pilot tap on campus — worth mentioning even though it's not part of this system.

---

## 8. Final Component List — 1 Pilot Washroom, 3 of 7 Taps

| Part | Model | Qty | Price |
|---|---|---|---|
| Controller | ESP32 dev board | 1 | ₹400–600 |
| Radio | EBYTE E32-433T20D LoRa module | 1 | ₹950–1,200 |
| Flow sensor | YF-S201 | 3 | ₹660–840 |
| Number display | 0.96" I2C OLED, SSD1306 | 3 | ₹450–660 |
| Color cue | WS2812B 8-LED ring | 3 | ₹300–450 |
| I2C multiplexer | TCA9548A (lets 3 OLEDs share one bus) | 1 | ₹100–150 |
| Thread adapter | Tap-thread to sensor-thread | 3 | ₹60–150 |
| Enclosure | IP65 sealed box | 1 | ₹150–250 |
| Cable glands | For wire entry points | ~6 | ₹120–180 |
| Power supply | 5V | 1 | ₹150–250 |
| **Total, one pilot washroom** | | | **~₹3,340–4,730** |

**Building floor gateway (one per floor — see Section 10):**

| Part | Model | Price |
|---|---|---|
| All-in-one board | TTGO LoRa32 (ESP32 + LoRa + OLED pre-wired) | ₹3,400–4,000 |
| Internet uplink | LAN from IT (preferred), or 4G SIM router | Free, or ₹1,500–2,500 + ₹300–400/mo |

**A 5-washroom pilot (all with 3 taps each) + 1 gateway: roughly ₹17,000–24,650.**

---

## 9. Exact Wiring — GPIO Pin Map (1 Washroom Controller)

| Job | ESP32 Pin(s) |
|---|---|
| Tap sensor 1 | GPIO25 |
| Tap sensor 2 | GPIO26 |
| Tap sensor 3 | GPIO27 |
| OLED bus (SDA / SCL, shared via multiplexer) | GPIO21 / GPIO22 |
| LED ring 1 | GPIO5 |
| LED ring 2 | GPIO13 |
| LED ring 3 | GPIO14 |
| LoRa TX / RX | GPIO17 / GPIO16 |
| LoRa mode pins (M0 / M1) | GPIO18 / GPIO19 |

**13 pins used out of ~25 available — 12 spare.** Comfortable headroom, including room to add the bulk meter later without redesigning anything.

**How each part connects:**
- Flow sensors: single signal wire each, straight to their GPIO pin, plus shared 5V and GND
- OLEDs: 4 wires each (VCC, GND, SDA, SCL) — SDA/SCL run to the multiplexer, which then connects to the ESP32's I2C pins
- LED rings: 3 wires each (5V, GND, DIN) — DIN goes to its own dedicated GPIO
- LoRa module: VCC→3.3V, GND→GND, plus the 4 pins above

None of this needs series/daisy-chain wiring except the I2C bus itself, which is a standard, well-documented shared-bus pattern, not something fragile.

---

## 10. Communication — How Data Actually Gets From a Tap to a Dashboard

**Why not just use college WiFi:** it needs a login portal, barely reaches inside washrooms, and every device would need separate credentials. LoRa was chosen specifically because it needs no login and penetrates walls at low power.

**Will it actually reach the gateway?** Confirmed technology, but the exact range through *your* specific building must be tested, not assumed — walls and especially **concrete floor slabs block LoRa signal significantly.**

**Final decision: one gateway per floor, not per building.** A single gateway usually cannot hear every floor of a multi-story building reliably through concrete slabs. If the building has an open stairwell or shaft, place the gateway there — it may then cover 2 floors instead of 1. Confirm with a walk-test (one sensor on the farthest washroom, one gateway on the candidate floor) before finalizing gateway count.

**The full data path:**
```
Tap sensor spins → produces electrical pulses → ESP32 counts them
    → converts count to liters (using a calibration number measured once, per sensor)
    → every 60 seconds, packages [washroom ID, tap 1/2/3 totals] into one small message
    → LoRa radio sends it → floor gateway receives it
    → gateway forwards it over the internet → lands in the database
    → dashboard reads the database and displays the numbers
```
If one message is lost to interference, nothing breaks — each message carries the running total, not just an increment, so the next message a minute later has the correct number anyway.

---

## 11. PCB and Physical Build — Final Decision

**No custom PCB.** It adds weeks of fabrication lead time and a new skill to learn, for zero benefit at this quantity (a handful of units). Use a **perfboard** (₹20–50, general-purpose grid board) inside the sealed enclosure — solder the connections by hand. Test everything on a breadboard on your desk first, confirm the numbers come out right, *then* move to perfboard for the version that actually goes near water.

**Waterproofing:**
- All electronics sealed inside one IP65 box — only the OLED and LED ring need to be visible
- Cut a small window for the display, cover with clear acrylic, sealed with silicone
- Every wire entering/exiting the box uses a cable gland (rubber-sealed fitting, ₹20–30 each)
- Mount the box slightly off to the side of the direct spray path, as extra margin
- The sensor itself doesn't need extra waterproofing — it's built to sit inline with running water

---

## 12. Tech Stack

**Hardware/firmware:** ESP32 (Arduino/C++ firmware, pulse counting, deep sleep between reads for power efficiency), YF-S201 flow sensors, WS2812 LED rings, SSD1306 OLEDs, TCA9548A multiplexer, EBYTE E32 LoRa modules.

**Backend** *(matches your existing stack):* FastAPI for ingestion, MongoDB Atlas for data storage, an MQTT broker (self-hosted Mosquitto, or HiveMQ free tier) as the message bus between the gateway and backend, hosted on Render.

**Frontend/dashboard:** Next.js + Tailwind for the admin dashboard and public leaderboard, hosted on Vercel free tier.

**Notifications:** Telegram bot for weekly digest summaries (same pattern as LOTOS v2).

---

## 13. Features

### Core (the pilot)
1. Live liter counter on the OLED — real-time session volume
2. Color threshold cue on the LED ring — green under threshold, red above, wordless
3. Per-washroom leaderboard (physical poster + optional web page)
4. A control washroom, untouched throughout, to isolate the real effect of the intervention from natural variation

### Later (once the pilot proves out)
5. Bulk washroom meter, for building/department-accurate totals (Section 5, Tier 1)
6. Leak/anomaly detection (needs the bulk meter — flow at odd hours with no expected use)
7. Facilities admin dashboard, separate from the public leaderboard
8. Auto-cutoff solenoid valve for taps left running unattended
9. Cost-savings translation (liters → ₹, for facilities buy-in)

### Explicitly out of scope
- Individual/ID-linked tracking — privacy risk disproportionate to the data value
- Water-quality sensing — a different problem, not this project

---

## 14. Execution Plan

### Stage 0 — Permission and survey (Weeks 1–2)
- [ ] Get written sign-off from facilities/warden before touching anything — gates everything below
- [ ] Pick one washroom, 3 of its 7 taps (nearest the entrance), and one separate washroom to serve as the untouched control
- [ ] Confirm tap spout thread compatibility with the YF-S201 mount on one tap
- [ ] Order the component list in Section 8 for one washroom + one gateway

### Stage 1 — Build and bench-test (Weeks 3–4)
- [ ] Wire everything on a breadboard, confirm correct liter counts against a measured jug of water, calibrate each sensor's pulses-per-liter individually
- [ ] Move to perfboard, solder, seal in the enclosure with cable glands and the display window

### Stage 2 — Range test and install (Week 5)
- [ ] Walk-test LoRa range from the pilot washroom to the intended gateway location; adjust gateway placement if needed
- [ ] Screw the 3 tap sensors onto the taps; mount the gateway
- [ ] Confirm data is landing correctly on the dashboard

### Stage 3 — Baseline (Weeks 6–7)
- [ ] Run silently — displays off or not yet installed, pure logging — for 2 weeks
- [ ] **Gate:** confirm a real, sizeable long-tail of wasteful sessions exists in the data before proceeding

### Stage 4 — Visibility (Weeks 8–10)
- [ ] Turn on the live liter counter only, no color yet
- [ ] Compare against Stage 3 baseline

### Stage 5 — Loss-aversion cue (Weeks 11–13)
- [ ] Turn on the color threshold cue
- [ ] Measure the marginal effect over Stage 4

### Stage 6 — Social comparison (Weeks 14–16)
- [ ] Put up the washroom-level leaderboard
- [ ] Measure the marginal effect over Stage 5

### Stage 7 — Decide on scaling (Week 17+)
- [ ] Take the full before/after data to facilities
- [ ] If funded, add the bulk meter (Section 5, Tier 1) and expand to more washrooms/buildings

---

## 15. Data & Evaluation Methodology

- **Control washroom** throughout isolates natural variation (exams, weather, holidays) from the intervention's real effect
- **Same-tap, same-weekday comparisons** across stages avoid confounding by day-of-week patterns
- **Report this honestly as a small pilot (3 taps, 1 washroom to start), not a statistically powered study** — accurate framing is more credible than an inflated claim
- Track three numbers throughout: liters per session, sessions per day, and long-tail frequency (proxy for "tap left running")

---

## 16. Risk Flags

- **Permission first, always** — non-negotiable, the actual first gate
- **Waterproofing** — sealed box + cable glands, confirmed above; one splash without this kills an ESP32
- **LoRa range through the specific building** — test before installing, don't assume
- **Tamper/vandalism** — mount out of easy reach, log at the sensor so data survives even if a display gets damaged
- **Thread compatibility for sensor mounting** — test on one tap first
- **Sample size honesty** — 3 taps in 1 washroom is a genuine pilot; don't overclaim significance from it

---

## 17. Immediate Next Steps

1. Draft a one-page proposal for facilities/warden: what's being installed, where, that it needs no plumbing (screw-on mount only), and how long the pilot runs
2. Order the Section 8 component list for one washroom + one gateway (~₹6,740–8,730 total for the first pilot unit)
3. Pick the exact washroom, the 3 taps within it, and the separate control washroom — write these down now, before any data exists
4. Set up the FastAPI + MongoDB Atlas skeleton so there's somewhere for data to land the day the first sensor goes live
