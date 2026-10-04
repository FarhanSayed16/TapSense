# TapSense — Reliability + Showcase Clarity Plan

**Goal:** Make the current pilot look **credible, stable, and clear** for professors — without jumping to the full campus master plan, and without waiting on perfect bucket calibration.

**Out of scope for this plan:** Phases 13–24 scale-up, big visual redesign, TDS/old water-quality code, person tracking.

**In scope:** Reliability of ESP → cloud → dashboard, and dashboard clarity that sells the science story in a 5–10 minute demo.

---

## 1. What “good for professors” means

They should understand in under a minute:

1. **What it is** — washroom tap sensing for behavior science (control vs intervention).  
2. **That it is live** — device online, liters moving when a tap runs.  
3. **That it is serious** — hierarchy, sessions, daily totals, no person IDs.  
4. **What Phase 0 means** — silent baseline; control tap has no guilt UI.

Demo script (keep this):

| Step | Action | What they should see |
|---|---|---|
| 1 | Open Overview | Device **online**, location crumb, Phase 0 badge |
| 2 | Open Tap A briefly | Liters / session activity updates |
| 3 | Open Tap B | Independent channel (not mixed with A) |
| 4 | Sessions page | Closed sessions with liters + duration |
| 5 | Device page | `device_01`, last seen, tap bindings |
| 6 | (Optional) LCD on board | TAP n + liters rotating |

---

## 2. Workstreams (do in this order)

### Stream A — Reliability (must ship before polish)

| # | Item | Why | Done when |
|---|---|---|---|
| A1 | **Demo runbook** (one page): start API `0.0.0.0:8000`, frontend, check health, check ESP Serial | No scramble in front of faculty | You can bring the stack up in &lt; 5 min from cold |
| A2 | **Fixed PC IP note** + firewall 8000; document `HTTP_INGEST_URL` update if IP changes | ESP fails silently when IP drifts | Written in runbook; tested once after router reboot |
| A3 | **Boot-safe message IDs** (already in firmware) + Serial shows `duplicate:false` on new flow | Prevents “200 but no dashboard change” | Reboot ESP twice; both runs increase liters |
| A4 | **Health strip on Overview** — API mongo/redis/device last-seen age | Professors see “system healthy” | Green/ok states visible without opening DevTools |
| A5 | **Stable power** — battery/barrel + common GND; no USB required except upload | Board stays up during demo | 30+ min continuous online without USB data |
| A6 | **Watchdog / Wi‑Fi reconnect** (already in pilot) — verify after AP blip | Campus Wi‑Fi flakes | Disconnect Wi‑Fi 30s → auto back → ingest resumes |
| A7 | **Optional: keep laptop awake** / power settings during demo | Sleep kills API | Demo laptop does not sleep for 1 hour |

### Stream B — Dashboard clarity (looks proper, not flashy)

| # | Item | Why | Done when |
|---|---|---|---|
| B1 | **Live session panel** on Overview — open sessions with tap + liters + “flowing now” | Makes the system feel alive | Opening a tap shows an active row within ~3s |
| B2 | **Per-tap cards** show today liters + last activity time | Clear science channels | Each tap card has liters + “Last: …” |
| B3 | **Device card clarity** — online/stale, RSSI if available, firmware label | Hardware competence signal | Device page readable in 10 seconds |
| B4 | **Sessions table polish** — tap name, liters, duration, long-tail flag, relative time | Evidence of logging | Table not empty after a short demo run |
| B5 | **7-day chart actually shows bars** when daily data exists | Empty chart looks unfinished | After 1 day of data, bars render |
| B6 | **Phase 0 explainer** (2–3 lines on Overview) — control vs intervention | Professors get the research framing | Text visible without scrolling past KPIs |
| B7 | **Hide/disable Reset today during faculty demo** (or move to Settings only) | Avoid accidental wipe mid-demo | Reset not on the primary demo surface *(Settings OK)* |
| B8 | **Login screen one-liner** — “TapSense Pilot · Hostel washroom monitoring” | First impression | Login looks intentional, not blank scaffold |

### Stream C — Showcase packaging (docs + talk track)

| # | Item | Why | Done when |
|---|---|---|---|
| C1 | **One-pager PDF/MD** — problem, method (control/intervention), stack diagram, current status | Leave-behind for professors | One page, no jargon walls |
| C2 | **Architecture sketch** — ESP → Wi‑Fi → API → Mongo → Admin UI | Shows engineering depth | Simple diagram in docs + maybe Overview help link |
| C3 | **Known limits slide** — placeholder calibration 450 p/L, Phase 0 silent, 3 taps pilot | Honesty builds trust | You can say limits in 20 seconds |
| C4 | **Photo of hardware board** in docs/README or one-pager | Physical prototype proof | 1 clear photo linked |
| C5 | **Demo checklist** printed/saved — preflight 10 minutes before meeting | Reduces demo risk | Checklist used once successfully |

### Stream D — Small firmware UX (board-side)

| # | Item | Why | Done when |
|---|---|---|---|
| D1 | LCD shows Wi‑Fi OK / IP on boot, then rotating tap liters | Physical demo without Serial | LCD readable at 1 m |
| D2 | LCD line for `ONLINE` vs `WIFI?` if disconnected | Failures visible on hardware | Unplug router → LCD shows problem |
| D3 | Do **not** show guilt messaging; control tap labeled `CTRL` only | Protects Phase 0 ethics | No “save water” text on LCD |

---

## 3. Suggested schedule (5–7 focused days)

| Day | Focus | Deliverable |
|---|---|---|
| **Day 1** | A1–A3, A7 | Demo runbook + reboot ingest proof |
| **Day 2** | B1, B2, B6, B7 | Overview feels live + research framing |
| **Day 3** | B3–B5, B8 | Sessions/Device/chart/login look finished |
| **Day 4** | A4–A6, D1–D2 | Health strip + board LCD status |
| **Day 5** | C1–C5 | One-pager + demo checklist + dry run |
| **Day 6–7** | Buffer | Fix bugs from dry run; optional light visual tidy |

Calibration and 10–14 day baseline stay on the **field track** in parallel when you have time — they are not blockers for a strong professor demo of the working pilot.

---

## 4. Explicitly do **not** do yet

- Full master plan (more buildings, 7+ taps, valves, mobile app)  
- Heavy animation / purple glow / generic AI dashboard restyle  
- Merging old TDS / buzzer project into TapSense  
- Public deployment before credentials are rotated and `.env` is clean  
- Changing tap A/B/C roles after you start any baseline log  

---

## 5. Acceptance checklist (professor-ready)

- [ ] Cold start → Overview online in &lt; 5 minutes  
- [ ] Open Tap A → liters move; Tap B independent  
- [ ] Sessions list shows the demo runs  
- [ ] Device shows online + last seen  
- [ ] LCD (if used) shows taps without guilt copy  
- [ ] One-pager + 60-second verbal story ready  
- [ ] You can name limits: calibration approx, Phase 0 silent, 3-tap pilot  

When this list is checked, the project **looks proper** for faculty. Then return to calibration → silent baseline → Phase 12 closeout → only then the full master plan.

---

## 6. Related files

| File | Role |
|---|---|
| `docs/GO-LIVE.md` | ESP ↔ API live link |
| `docs/mvp-master-execution-plan.md` | Full MVP phase list |
| `docs/phase-11-baseline-protocol.md` | After showcase, field science |
| `firmware/tapsense_pilot/tapsense_pilot.ino` | Live battery firmware |
| `docs/SHOWCASE-RELIABILITY-PLAN.md` | **This plan** |

---

## 7. Implementation status (2026-10-03)

| Item | Status |
|---|---|
| Overview live sessions + Phase 0 blurb + health pills | Done |
| Tap cards with last activity / flowing now | Done |
| Reset today moved to Settings only | Done |
| Device page RSSI + clearer online banner | Done |
| Sessions table polish (names, relative time) | Done |
| 7-day chart padded strip | Done |
| Login faculty one-liner | Done |
| `docs/DEMO-RUNBOOK.md` | Done |
| `docs/SHOWCASE-ONEPAGER.md` | Done |
| Pilot LCD ONLINE / WIFI? rotation | Done |

**Your steps:** hard-refresh UI, re-upload `tapsense_pilot.ino`, dry-run `DEMO-RUNBOOK.md`.
