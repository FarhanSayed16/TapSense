# MVP Deliverable — Calibration Record

Fill after Phase 10 bucket tests. Mirror values into `firmware/tapsense_pilot/config.h`.

**Site:** _______________ **Date:** _______________ **Operator:** _______________

| Tap | Role | GPIO | Final pulses/L | Check error % | Backend updated | Firmware uploaded |
|---|---|---|---|---|---|---|
| tap_a | Control | 27 | | | [ ] | [ ] |
| tap_b | Intervention | 26 | | | [ ] | [ ] |
| tap_c | Intervention | 25 | | | [ ] | [ ] |

Method notes / bucket size: _______________

CLI reminder:
```powershell
python -m scripts.set_calibration --tap tap_a --ppl ____
```
