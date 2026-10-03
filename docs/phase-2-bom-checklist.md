# Phase 2 — Wave 1 Hardware BOM & Shopping Checklist

**Pilot kit:** 1× ESP32 + 3× YF-S201 · one washroom  
**Wiring reference:** `hardware/CONNECTIONS.md`  
**Budget ballpark:** ~₹3,000–5,000 for Wave 1 (before optional displays)

---

## 2.1 Must buy (order tomorrow)

| # | Item | Qty | Approx ₹ | Bought? | Received? | Notes |
|---|---|---|---|---|---|---|
| 1 | ESP32 DevKit (30-pin or 38-pin) | 1 | 400–600 | [ ] | [ ] | USB-C/micro as available |
| 2 | YF-S201 hall flow sensor | 3 | 220–280 each | [ ] | [ ] | Check thread size vs taps |
| 3 | IP-rated enclosure | 1+ | 100–150 | [ ] | [ ] | Fits ESP + cable glands if possible |
| 4 | 5V power supply (≥1–2A) | 1 | 150–250 | [ ] | [ ] | Field power; USB OK for bench |
| 5 | Dupont wires / jumper set | 1 | 50–100 | [ ] | [ ] | |
| 6 | Pipe fittings / adapters for YF-S201 | as needed | 100–300 | [ ] | [ ] | Match sensor + tap thread |
| 7 | PTFE (Teflon) tape | 1 | 20–50 | [ ] | [ ] | |
| 8 | USB cable for ESP programming | 1 | 50–150 | [ ] | [ ] | Data cable, not charge-only |

**Suggested shops:** Robu, RND, local electronics market, Amazon/Flipkart (verify seller).

---

## 2.2 Optional (after Phase 0 — not for tomorrow)

| Item | Qty | Approx ₹ | For |
|---|---|---|---|
| WS2812 LED ring **or** 0.96" OLED | 1–2 | 150–250 each | Tap B/C live liters only |
| Extra enclosure / glands | 1 | 100+ | Cleaner field mount |

**Do not buy yet:** solenoid valve, 12V relay (Phase 4 only).

---

## 2.3 Receive & inventory

- [ ] Count matches table above  
- [ ] ESP32 powers on via USB (LED / COM port appears)  
- [ ] Each YF-S201 has VCC / GND / OUT (or red/black/yellow) and flow arrow  
- [ ] Fittings screw onto sensor without forcing  
- [ ] Store kit together; mark box **TapSense Wave 1**

---

## 2.4 Pin reminder (after parts arrive)

| Tap | GPIO |
|---|---|
| A (control) | 27 |
| B | 26 |
| C | 25 |
| Power | 5V + GND shared |

---

## Phase 2 gate

- [ ] Full Wave 1 kit received and inventoried  

**Received by:** _______________ **Date:** _______________
