# College Water-Tap Water-Saving System — Execution Plan

## Design decision: subconscious loss-aversion, not literal guilt messaging

Your instinct is right — the reaction needs to happen *in the moment, without thinking*. But literal guilt text ("You're wasting water!") is the weak version of that idea. Behavioral research on household water/energy conservation (Fielding et al. 2012, Ambaum et al. 2024 — the same literature the reference deck you shared cites) consistently shows two things:

1. **Explicit shame/guilt messaging triggers reactance.** People resent being scolded by a machine, especially repeatedly, and either ignore it or actively defeat it (cover the sensor, avoid the tap).
2. **The two levers that actually work are (a) real-time visceral feedback of the resource depleting, and (b) social norm comparison** ("you're using more than average"). Both create the *feeling* of guilt without ever using the word — loss aversion does the emotional work that a guilt-trip message tries to do, but without the resentment.

**Final design:** every tap shows real-time flow + a red/green threshold cue (visceral, wordless) plus a social leaderboard by block/wing (norm comparison). No moralizing text anywhere. This gets you the subconscious "I'm wasting" flinch you're after, with a much lower chance of people vandalizing the sensor out of irritation.

This plan keeps your idea intact — it's still an "every time you waste, you feel it" system — it just uses the version of that mechanism that survives contact with real users.

---

## Phase 0 — Baseline data (Week 1–2)

**Goal:** know the real numbers before changing anything. No display, no visible change — pure logging.

- [ ] Get written sign-off from hostel warden / facilities department before touching any tap — **this gates everything below.** Frame it as a sanctioned college project (cite your SIH win for credibility if useful).
- [ ] Select 5–6 taps across 2–3 locations: hostel washroom, canteen, one classroom-block washroom. Keep 1 tap as a **permanent control** (logged for the entire project, never gets a display) — you need this to separate "behavior actually changed" from "usage naturally varies by week/weather/exams."
- [ ] Install: ESP32 + YF-S201 flow sensor inline on each tap, inside a sealed IP-rated junction box. Log pulses → liters, timestamp, session start/stop (gap of >5s = new session).
- [ ] Data path: if WiFi reaches the tap, push to FastAPI + MongoDB Atlas over MQTT (your existing stack). If washroom WiFi is patchy (likely), log to onboard SD/flash and batch-sync when the ESP32 reconnects — check this in week 1, don't assume WiFi coverage.
- [ ] Run for 10–14 days minimum, spanning both weekdays and a weekend.

**Deliverable:** per-tap daily liters, average session volume, peak hours, and — critically — how much volume comes from "long-tail" sessions (taps left running, no motion) vs normal use. That long tail is your actual target.

**Gate to Phase 1:** you need a real, sizeable long-tail (e.g. >15% of volume from sessions well above the median) to justify the intervention. If the data doesn't show meaningful waste, the story for the project changes — say so honestly rather than forcing the narrative.

---

## Phase 1 — Make it visible (Week 3–5)

**Goal:** isolate the effect of *pure visibility*, before adding any norm/threshold logic.

- [ ] Add to the same taps (except the control): a small WS2812 LED ring or 0.96" OLED next to the faucet showing running liters for the current session — no color coding, no judgment, just the number.
- [ ] Keep logging exactly as Phase 0.
- [ ] Compare same-tap, same-weekday behavior: Phase 0 baseline vs Phase 1 with display live.

**Deliverable:** % change in average session volume and long-tail frequency, attributable to visibility alone.

**Gate to Phase 2:** even a small drop (5–10%) confirms the mechanism is working and justifies layering on the next piece. If there's no drop at all, the display placement/visibility itself needs redesign before you add complexity on top of it.

---

## Phase 2 — Loss-aversion cue (Week 6–8)

**Goal:** add the "subconscious flinch" layer, without words.

- [ ] Compute a rolling per-tap threshold from Phase 0/1 data (e.g. median session volume for that tap).
- [ ] LED ring: green while under threshold, shifts to amber then red as the session crosses it. No text, no message — just color and, optionally, a short pulse/flicker at the moment it crosses (the visceral "uh-oh" cue).
- [ ] Track per-tap, not per-person — no ID card/RFID tagging. Individual tracking on a college campus raises consent and surveillance concerns that aren't worth the marginal data value, and could get the project shut down by facilities/admin.
- [ ] Optional: a small daily/weekly cumulative counter per tap ("This tap: 340 L today") — impersonal, factual, still lands as a wastage signal without pointing at anyone.

**Deliverable:** measure the marginal drop over Phase 1 (visibility alone). This is the number that tells you whether the loss-aversion cue is earning its complexity.

---

## Phase 3 — Social norm comparison (Week 9–11)

**Goal:** this is the strongest lever in the literature (descriptive + injunctive norms) — use it.

- [ ] Aggregate data by block/wing/floor, not individual.
- [ ] Put up a simple physical leaderboard near common areas (canteen noticeboard, hostel entrance) updated weekly: "Block A: 310 L/day · Block B: 240 L/day."
- [ ] If you want a live version, a single-page dashboard (Next.js or even a static page hosted on Vercel free tier, your existing pattern) pulling from the same MongoDB data works — but the physical poster matters more for this effect than the app does.
- [ ] Light gamification: shout-out or small reward for the lowest-consuming block each week.

**Deliverable:** marginal drop over Phase 2. By this point you should have a clean, three-layer attribution: visibility effect, loss-aversion effect, social-norm effect — which is genuinely good data for a paper/report, better than what the reference deck you shared produced (they never got test results at all).

---

## Phase 4 — Hard intervention: auto-cutoff (Week 12+, stretch goal)

**Goal:** stop relying on psychology alone for the worst offenders — taps physically left running.

- [ ] Add a 12V DC normally-closed solenoid valve inline, controlled by the same ESP32 via a relay.
- [ ] Logic: if continuous flow exceeds N seconds with no proximity/motion detected nearby, auto-close the valve. This directly kills the "left the tap running" failure mode from your own persona data, rather than hoping the LED talks someone out of it.
- [ ] **Before ordering:** check actual water pressure at your specific taps — cheap solenoid valves are rated for a fairly narrow pressure band (roughly 0.02–0.8 MPa in the units sold for this). Gravity-fed tanks (very common in Indian buildings) can fall outside that range; confirm before buying, not after.
- [ ] This phase needs facilities' explicit sign-off separately — you're now controlling water supply, not just measuring it. Treat it as a distinct approval gate from Phase 0.

---

## Technical architecture

```
Tap → YF-S201 flow sensor → ESP32 (pulse count, deep-sleep between reads)
    → WiFi/MQTT (or SD buffer if WiFi is weak) → FastAPI backend (Render)
    → MongoDB Atlas → simple dashboard (Next.js/Vercel, optional)
Phase 4 adds: ESP32 → relay → 12V solenoid valve (fail-closed)
```

This is entirely inside your existing stack (ESP32, FastAPI, MongoDB Atlas, Vercel) — no new tools to learn.

---

## Bill of materials (per tap, India pricing, researched)

| Component | Purpose | Cost (₹) |
|---|---|---|
| ESP32 dev board | Controller + WiFi | 400–600 |
| YF-S201 flow sensor | Flow measurement | 220–280 |
| WS2812 LED ring or 0.96" OLED | Visible feedback | 150–250 |
| IP-rated enclosure | Waterproofing (non-negotiable near a tap) | 100–150 |
| 5V power supply + wiring/misc | Power | 150–250 |
| **Subtotal (Phases 0–3, per tap)** | | **~₹1,000–1,500** |
| 12V solenoid valve (NC, 1/2") | Auto-cutoff (Phase 4 only) | 230–500 |
| 12V relay module | Valve control (Phase 4 only) | 50–100 |
| 12V power adapter (Phase 4 only) | Valve power | 150–200 |
| **Add for Phase 4** | | **+~₹450–800** |

**5-tap pilot (Phases 0–3 only): roughly ₹5,000–7,500 total.** Fully within a self-funded student project budget. Phase 4 adds ~₹2,000–4,000 across the same 5 taps if you go that far.

---

## Risk flags (check before you build, not after)

- **Permission first.** No installation without facilities/warden sign-off — this isn't optional, it's the actual first gate.
- **Waterproofing.** Any electronics near a running tap needs a sealed enclosure; a single splash kills an ESP32.
- **WiFi coverage.** Washrooms are notoriously bad WiFi zones — confirm in week 1, have the SD-buffer fallback ready rather than discovering this after installing 5 units.
- **Tamper/vandalism.** Hostel taps get rough treatment — mount enclosures out of easy reach, and don't rely on the LED being intact for your data (log at the sensor, not just the display).
- **Sample size honesty.** 5–6 taps is a pilot, not a statistically powered study — if this becomes a paper or SIH-style submission, say "pilot study, N=5" rather than overclaiming significance, the same way the original deck's unverified "10–20% savings" claim is a weak point you can visibly do better than.
- **Privacy.** No per-person tracking (RFID/ID card) — keep everything tap- and block-level.

## Immediate next steps (this week)

1. Draft a one-page proposal for facilities/warden — what you're installing, where, for how long, and that it's non-invasive to plumbing (Phases 0–3 don't touch the water path at all, only sit inline with a flow sensor).
2. Order Phase 0 hardware for 5–6 taps (~₹6,000 covers sensors + boards + enclosures with margin).
3. Pick your 5–6 tap locations now, including the 1 control tap, and write down which is which before any data comes in — deciding this after you see the numbers biases the result.
