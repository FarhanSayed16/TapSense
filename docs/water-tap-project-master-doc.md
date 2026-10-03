# TapSense — College Water-Tap Behavior System
### Complete Project Document

*(Name is a placeholder — swap it for anything you prefer, nothing downstream depends on it.)*

---

## 1. Executive Summary

TapSense is an IoT system installed on college water taps that makes water usage **visible, felt, and compared** in real time — turning an invisible resource into one people subconsciously react to before they waste it. It combines a flow sensor, a wordless visual feedback cue, and a social leaderboard, backed by a data pipeline that proves (not just claims) how much water each layer actually saves. It's built on hardware and a stack you already know (ESP32, FastAPI, MongoDB, Next.js), costs roughly ₹5,000–7,500 for a 5-tap pilot, and produces real measured data — something the reference project you shared never actually did.

---

## 2. The Problem

### 2.1 Why this matters at all (macro context)
- India holds ~18% of the world's population but only ~4% of global water resources; per-capita availability (~1,100 m³) sits close to the international scarcity threshold (1,000 m³).
- Consequences compound across health (waterborne disease from poor water access), agriculture (lower yields, higher food prices), and cities (Chennai-style acute shortages).

### 2.2 The actual, addressable problem
The macro crisis doesn't change individual behavior — invisibility does. **When resource depletion is hidden from sight and carries no immediate cost, people over-use it.** At the level of a single tap, nobody:
- knows how much water a session (handwash, dishwash, shower) actually costs
- gets any feedback when a tap is left running
- has any comparison point for "is this normal or excessive"

This is a **behavioral gap, not an awareness gap.** Everyone already knows water is scarce in the abstract; nobody feels it at the sink. That gap is what TapSense targets.

### 2.3 Where this shows up on your campus specifically
- Taps left running while lathering/soaping (hostel washrooms, canteen)
- No sense of quantity used per session — people can't estimate liters, only "felt like a while"
- No consequence structure — unlike a home water bill, a college tap has zero cost feedback to the individual user
- Facilities staff have no visibility into per-location usage, so leaks or chronically wasteful taps go unnoticed until a bill spike

---

## 3. Research Foundation

Two frameworks anchor the design (same ones used in serious behavior-design literature and in the reference deck you shared):

**Design Thinking loop:** Empathy → Define → Ideate → Prototype → Test → Implement. We're using this loop for real, not just as a slide — Phase 0 below *is* the empathy/data-gathering step, and every later phase gates on the previous one's test results.

**Fogg Behavior Model:** `Behavior = Motivation × Ability × Prompt`. A working intervention needs all three, not just one:
- **Prompt** — the visible display, the color cue, the leaderboard
- **Ability** — for most users, ability is already high (turning off a tap is easy); the auto-cutoff valve in Phase 4 is what handles the minority who won't self-correct
- **Motivation** — this is where design choice matters most, covered next

**Key behavioral-science finding (Fielding et al. 2012; Ambaum et al. 2024; Addo et al. 2018; Sanchez et al. 2023):** explicit guilt/shame messaging tends to produce **reactance** — people resent being scolded by a machine and either ignore it or defeat it (cover the sensor, avoid the tap). The two levers with actual evidence behind them are:
1. **Real-time visceral feedback** (loss aversion — watching a number climb or a color shift triggers the same "I'm losing something" reflex guilt is trying to manufacture, without the resentment)
2. **Social norm comparison** (descriptive + injunctive norms — "your block uses more than others" is consistently one of the strongest levers in household water/energy studies)

**Design decision:** TapSense uses both, and deliberately avoids literal guilt text anywhere in the system. Same emotional target — the subconscious flinch at wasting water — reached through a mechanism that survives contact with real users instead of getting resented and disabled.

---

## 4. The Idea — What We're Building

A tap-mounted sensor + feedback unit that:
1. Measures every liter that passes through, in real time
2. Shows that number back to the user instantly (visibility)
3. Shifts color when usage crosses a personal/tap-level threshold (loss-aversion cue)
4. Feeds into a block-vs-block leaderboard so units compete socially, not individually (norm comparison)
5. Optionally cuts off flow automatically if a tap is left running unattended (hard backstop)

No per-person tracking (no ID cards, no RFID) — everything is tap- and block-level, both for privacy and because it's the block-level comparison, not individual shaming, that the evidence actually supports.

---

## 5. Features

### Core (Phases 0–3 — the actual pilot)
| # | Feature | What it does |
|---|---|---|
| 1 | Silent flow logging | Baseline data collection, zero visible change to the tap |
| 2 | Live liter counter | Real-time session volume shown at the tap |
| 3 | Threshold color cue | LED shifts green → amber → red as a session crosses the per-tap median |
| 4 | Per-tap daily/weekly total | Impersonal cumulative counter ("This tap: 340 L today") |
| 5 | Block/wing leaderboard | Physical + optional web leaderboard comparing usage across locations |
| 6 | Control-tap benchmarking | One tap stays untouched throughout, to isolate the intervention's real effect from natural variation |

### Stretch (Phase 4+)
| # | Feature | What it does |
|---|---|---|
| 7 | Auto-cutoff valve | Solenoid valve shuts flow after N seconds of continuous, unattended running |
| 8 | Leak/anomaly detection | Flags flow at odd hours with no expected usage pattern — catches leaks, not just waste |
| 9 | Facilities admin dashboard | Building-wide usage view for facilities staff — separate from the public leaderboard |
| 10 | Cost-savings translation | Converts liters saved into ₹ (and the college's water bill) — useful for facilities/admin buy-in |
| 11 | Weekly Telegram digest | Auto-summary of savings sent to your project team or the facilities office |

### Ideas worth noting but explicitly out of scope for v1
- **Individual/ID-linked tracking** — deliberately excluded; raises consent/surveillance concerns disproportionate to the data value
- **App-based gamification (points, streaks)** — nice extension once the physical leaderboard is proven to work; don't build it first
- **Extending to electricity/other utilities** — a natural v2 direction once this pilot has real numbers, but scope creep if pulled into v1
- **Water-quality sensing** — a different problem (potability, not conservation); skip entirely for this project

---

## 6. Tech Stack

**Hardware / firmware**
- ESP32 dev board (WiFi, deep-sleep between reads for power efficiency)
- YF-S201 hall-effect flow sensor
- WS2812 addressable LED ring (or 0.96" OLED) for the visual cue
- 12V DC normally-closed solenoid valve + relay module (Phase 4 only)
- IP-rated enclosure (mandatory — electronics next to running water)
- Firmware in Arduino/C++: pulse counting → liters, session detection, MQTT publish

**Backend** *(all matches your existing stack — nothing new to learn)*
- FastAPI (Python) for the ingestion/API layer
- MongoDB Atlas for time-series-style usage data
- MQTT broker (HiveMQ free tier, or self-hosted Mosquitto if you want zero external dependency) as the message bus between taps and backend
- Render (Starter tier) for hosting, same pattern you use elsewhere

**Frontend / dashboard**
- Next.js + Tailwind for the admin/leaderboard dashboard
- Vercel free tier for hosting

**Notifications**
- Telegram bot for weekly digest summaries (same pattern as LOTOS v2)

**Data flow**
```
Tap → YF-S201 (pulses) → ESP32 (counts, deep-sleeps between reads)
    → MQTT → FastAPI ingestion → MongoDB Atlas
    → Next.js dashboard (admin + leaderboard) / Telegram digest bot

Phase 4 adds: ESP32 → relay → 12V solenoid valve (fail-closed on no-power)
```

---

## 7. Hardware — Bill of Materials & Cost (India pricing, researched)

| Component | Purpose | Cost (₹) |
|---|---|---|
| ESP32 dev board | Controller + WiFi | 400–600 |
| YF-S201 flow sensor | Flow measurement | 220–280 |
| WS2812 LED ring or 0.96" OLED | Visible feedback | 150–250 |
| IP-rated enclosure | Waterproofing (non-negotiable) | 100–150 |
| 5V power supply + wiring/misc | Power | 150–250 |
| **Subtotal per tap (Phases 0–3)** | | **~₹1,000–1,500** |
| 12V solenoid valve (NC, 1/2") | Auto-cutoff — Phase 4 only | 230–500 |
| 12V relay module | Valve control — Phase 4 only | 50–100 |
| 12V power adapter | Valve power — Phase 4 only | 150–200 |
| **Add per tap for Phase 4** | | **+~₹450–800** |

**5-tap pilot, Phases 0–3 only: ~₹5,000–7,500 total.** Fully self-fundable. Phase 4 across the same 5 taps adds roughly ₹2,000–4,000 more.

---

## 8. Execution Plan

### Phase 0 — Baseline data (Week 1–2)
**Goal:** know the real numbers before changing anything.
- [ ] Get written sign-off from hostel warden/facilities before touching any tap — **gates everything.**
- [ ] Pick 5–6 taps across 2–3 locations (hostel washroom, canteen, one classroom-block washroom); keep **1 as a permanent control** (never gets a display, logged the whole project).
- [ ] Install ESP32 + YF-S201 inline, sealed in an IP-rated box, on each tap.
- [ ] Confirm WiFi actually reaches each tap location in week 1 — washrooms are notorious dead zones. Fall back to SD-card logging + periodic sync if not.
- [ ] Run 10–14 days, spanning weekdays and a weekend.
- **Deliverable:** per-tap daily liters, average session volume, peak hours, and the size of the "long-tail" (taps left running / unattended flow).
- **Gate:** need a real, sizeable long-tail (e.g. >15% of volume from abnormally long sessions) to justify the rest of the project.

### Phase 1 — Visibility (Week 3–5)
**Goal:** isolate the effect of pure visibility, nothing else.
- [ ] Add the live liter counter to all non-control taps. No color, no judgment, just the number.
- [ ] Compare same-tap, same-weekday Phase 0 vs Phase 1.
- **Deliverable:** % change in average session volume and long-tail frequency from visibility alone.
- **Gate:** even a 5–10% drop justifies adding the next layer. No drop at all means redesign the display before adding complexity.

### Phase 2 — Loss-aversion cue (Week 6–8)
**Goal:** add the wordless "flinch" layer.
- [ ] Compute a per-tap threshold (e.g. median session volume from Phase 0/1).
- [ ] LED: green under threshold, shifting to red as a session crosses it — color and a brief pulse, no text.
- [ ] Add impersonal per-tap daily/weekly totals.
- **Deliverable:** marginal drop over Phase 1 alone.

### Phase 3 — Social comparison (Week 9–11)
**Goal:** the strongest lever in the literature.
- [ ] Aggregate by block/wing, never by individual.
- [ ] Physical leaderboard in a common area, updated weekly; optional live web version.
- [ ] Light recognition for the lowest-consuming block each week.
- **Deliverable:** marginal drop over Phase 2. By now you have clean attribution across three layers — visibility, loss-aversion, social norm — which is genuinely strong data for a report or submission.

### Phase 4 — Auto-cutoff (Week 12+, stretch)
**Goal:** stop relying on psychology alone for the taps that never self-correct.
- [ ] Add a 12V solenoid valve + relay, controlled by the same ESP32.
- [ ] Auto-close after N seconds of continuous flow with no motion nearby.
- [ ] **Before ordering:** verify actual water pressure at your taps — cheap solenoid valves have a fairly narrow rated pressure band, and gravity-fed tanks (common in Indian buildings) can fall outside it.
- [ ] This phase needs its own, separate facilities sign-off — you're now controlling water supply, not just measuring it.

---

## 9. Data & Evaluation Methodology

- **Control tap** throughout the entire project isolates natural variation (exams, weather, holidays) from the intervention's real effect.
- **Same-tap, same-weekday comparisons** across phases avoid confounding by location or day-of-week usage patterns.
- **Report the pilot honestly as N=5–6, not a statistically powered study** — if this becomes a paper, SIH-style submission, or internal report, "pilot study" framing is both accurate and more credible than an inflated claim.
- Track three numbers throughout: total liters/day per tap, average session volume, and long-tail frequency (proxy for "tap left running").

---

## 10. Risk Flags

- **Permission first, always.** No install without facilities/warden sign-off — non-negotiable, first gate.
- **Waterproofing.** Any electronics near a tap needs a sealed IP-rated enclosure; one splash kills an ESP32.
- **WiFi coverage.** Confirm in week 1; have the SD-buffer fallback ready rather than discovering the gap after installing 5 units.
- **Tamper/vandalism.** Hostel taps get rough handling — mount out of easy reach, log at the sensor (not just the display) so data survives even if someone messes with the LED.
- **Sample size honesty.** 5–6 taps is a pilot — don't overclaim statistical significance.
- **Privacy.** No per-person tracking, ever. Tap- and block-level only.
- **Pressure compatibility (Phase 4 only).** Verify before ordering solenoid valves, not after.

---

## 11. Future Scope / Scaling

- **Campus-wide rollout** once the pilot proves the effect — same architecture, just more taps.
- **Facilities product angle**: the admin dashboard + leak detection could become something the college's facilities department actually wants to keep running past your project timeline, giving it a life beyond the assignment.
- **Green certification narrative**: real, measured savings data gives the college a genuine (not aspirational) input for sustainability reporting or IGBC-style green building recognition.
- **Publication/competition angle**: given your SIH win, a working pilot with real before/after data is a strong candidate for a paper or a future hackathon submission — the reference deck you shared never got past the concept stage; you'd be one of the few versions of this idea with actual test results.
- **Multi-utility extension**: electricity or LPG usage feedback using the same behavioral pattern — a clear v2, not a v1 feature.

---

## 12. Immediate Next Steps

1. Draft a one-page proposal for facilities/warden: what's being installed, where, for how long, and that Phases 0–3 don't touch the plumbing at all (only sit inline with a flow sensor).
2. Order Phase 0 hardware for 5–6 taps (~₹6,000 covers sensors, boards, and enclosures with margin).
3. Pick your 5–6 tap locations now, including the control tap, and write them down before any data comes in — deciding this after seeing the numbers biases the result.
4. Set up the FastAPI + MongoDB Atlas skeleton so data has somewhere to land the day the first sensor goes live.
