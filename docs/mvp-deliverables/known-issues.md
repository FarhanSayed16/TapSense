# MVP Deliverable — Known Issues (Living)

Update as you learn on bench/field.

## Software / platform
| Issue | Mitigation | Status |
|---|---|---|
| Python 3.14 may fail pydantic wheels on Windows | Use **Python 3.12** venv | Known |
| Docker Desktop must be running for local Mongo | `docker start tapsense-mongo` | Known |
| HiveMQ public broker is shared / not private | Fine for pilot; move to private MQTT later | Known |
| aiomqtt/Proactor on Windows | Use Paho thread subscriber (already done) | Resolved |
| `.local` emails rejected by validators | Admin is `admin@tapsense.app` | Resolved |

## Hardware / field
| Issue | Mitigation | Status |
|---|---|---|
| Washroom WiFi dead zones | Test week 1; hotspot fallback; document | Open until site test |
| Splash kills ESP | IP enclosure mandatory | Process |
| YF-S201 ±5–10% accuracy | OK for behavior pilot; bucket calibrate | Expected |
| Long signal wires → noise | Keep short; debounce in firmware | Mitigated in FW |
| One ESP failure = 3 taps dark | Acceptable for MVP; later 1 ESP/tap | Accepted risk |

## Product / science
| Issue | Mitigation | Status |
|---|---|---|
| N=3 is a pilot | Honest reporting; control tap | Process |
| No display until Phase 11 GO | Silent baseline first | Process |
