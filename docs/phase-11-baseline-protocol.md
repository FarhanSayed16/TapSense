# Phase 11 — Silent Baseline Protocol (Product Phase 0)

**Goal:** Collect honest pre-intervention water-use data for 10–14 days.  
**Rule:** **No displays, no color cues, no leaderboard, no guilt UI.** Sensor + logging only.  
**Prereq:** Phase 10 gate (24h stable field install + calibration).

---

## Locked for the whole run

| Lock | Value |
|---|---|
| Tap A | **Control** — never add display later either during Phases 11–12 stretch |
| Tap B / C | Intervention (still silent in Phase 11) |
| Firmware cal / PPL | Do not change mid-run except emergency (document if you do) |
| Tap IDs / locations | Do not reassign |
| Privacy | Tap-level only — no person tracking |

---

## 11.1 Run protocol

### Start day
- [ ] Displays **off / not installed**  
- [ ] Record **baseline_start_date** (campus TZ Asia/Kolkata): _______________  
- [ ] Planned **baseline_end_date** (≥10 days later, include ≥1 weekend): _______________  
- [ ] Confirm Overview shows all 3 taps reporting  
- [ ] Screenshot / export Day 0 overview: _______________  
- [ ] Log start in `docs/phase-11-daily-ops-log.md`

### During run (10–14 days)
- [ ] Weekdays + at least one Saturday/Sunday covered  
- [ ] No LED/OLED added to B/C  
- [ ] No firmware feature experiments  
- [ ] Fill daily ops log (quick checks)

### End day
- [ ] Record actual **baseline_end_date**: _______________  
- [ ] Run baseline report script (below)  
- [ ] Fill `docs/phase-11-baseline-note-template.md`  
- [ ] Record **go / no-go** for Phase 1 visibility  

---

## 11.2 Daily ops (use the log sheet)

Each day (or every other day if solid):
1. Device online / last-seen OK?  
2. Any leak / wet enclosure?  
3. All three taps have some activity OR expected quiet hours noted?  
4. Big data gap? (note hours)

Day 1, mid-run, and final day are **mandatory**.

---

## 11.3 Metrics (auto + note)

Generate report:

```powershell
cd backend
.\.venv\Scripts\python -m scripts.baseline_report --start YYYY-MM-DD --end YYYY-MM-DD
```

Writes:
- `docs/baseline-reports/baseline_YYYYMMDD_YYYYMMDD.json`
- `docs/baseline-reports/baseline_YYYYMMDD_YYYYMMDD.md`

Also available: `GET /api/v1/reports/baseline?start=...&end=...` (admin JWT).

Report includes:
- Liters/day per tap  
- Average session volume per tap  
- Peak hours (session starts)  
- Long-tail share (sessions + volume)  
- Control vs intervention descriptive comparison  

---

## 11.4 Science gate (go / no-go)

From product master doc: need a **real, sizeable long-tail** to justify visibility layers.

**Suggested rule of thumb (adjust with honesty):**
- Long-tail **volume share ≥ ~15%**, **or**
- Clear pattern of taps left running in peak hours, **or**
- Other strong waste signal you can defend in writing  

If **no** material waste signal → redesign display later or pause; do **not** pretend Phase 1 will magically create a story.

Record decision in the baseline note template.

---

## Phase 11 gate

- [ ] ≥10 days clean data retained  
- [ ] Baseline note written  
- [ ] Go / no-go recorded for adding visibility (product Phase 1)  

**Then:** Phase 12 MVP closeout (and optional Phase 1 readiness if **go**).
