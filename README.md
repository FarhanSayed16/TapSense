# 🚰 TapSense — Intelligent College Water-Tap Behavior & Conservation Platform

<div align="center">

![Next.js](https://img.shields.io/badge/Next.js-15.1.0-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React-19.0.0-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![Python](https://img.shields.io/badge/Python-3.12-3776AB?style=for-the-badge&logo=python&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas%20Time--Series-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![MQTT](https://img.shields.io/badge/MQTT-HiveMQ%20Broker-660066?style=for-the-badge&logo=eclipsemosquitto&logoColor=white)
![ESP32](https://img.shields.io/badge/ESP32-Dual%20Core%20IoT-E7352C?style=for-the-badge&logo=espressif&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)

<p align="center">
  <b>A Cyber-Physical IoT & Behavioral Conservation System Engineered to Eliminate Institutional Water Waste in College Campuses.</b>
</p>

[✨ Live System Showcase](#-live-system-showcase) •
[⚡ Quick Start](#-quick-start) •
[🏛️ Architecture](#-system-architecture) •
[🔌 Hardware & Pinout](#-hardware-specification--electrical-pinouts) •
[📊 Behavioral Science](#-behavioral-science--pilot-methodology) •
[📡 API Reference](#-api-reference--telemetry-protocol)

---

</div>

> [!IMPORTANT]
> **TapSense** is not just a passive water meter. It is a closed-loop cyber-physical platform combining **edge microcontrollers (ESP32)**, **sub-second flow metering**, **scientific A/B control testing**, and **real-time behavioral nudges** (visual cues, social comparison leaderboards, public dining-hall displays, and automated solenoid safety shutoffs) to permanently curb water wastage in collegiate facilities.

---

## 📑 Table of Contents

- [🌟 System Highlights](#-system-highlights)
- [📸 Live System Showcase](#-live-system-showcase)
  - [1. Aquatic Authentication Portal](#1-aquatic-authentication-portal)
  - [2. Executive Operations Dashboard](#2-executive-operations-dashboard)
  - [3. Tap Nodes & Flow Matrix](#3-tap-nodes--flow-matrix)
  - [4. Volumetric Flow Sessions & Waste Ledger](#4-volumetric-flow-sessions--waste-ledger)
  - [5. IoT Edge Devices & Telemetry Diagnostics](#5-iot-edge-devices--telemetry-diagnostics)
  - [6. Campus Conservation Leaderboard](#6-campus-conservation-leaderboard)
  - [7. Public Kiosk Signage Display](#7-public-kiosk-signage-display)
  - [8. Behavioral Science & Interventions](#8-behavioral-science--interventions)
  - [9. Scientific Pilot Phases Tracker](#9-scientific-pilot-phases-tracker)
  - [10. Facility Thresholds & Automated Shutoffs](#10-facility-thresholds--automated-shutoffs)
  - [11. Real-Time Anomaly & Leak Alerts](#11-real-time-anomaly--leak-alerts)
- [🏛️ System Architecture](#-system-architecture)
- [🔌 Hardware Specification & Electrical Pinouts](#-hardware-specification--electrical-pinouts)
- [📁 Repository Structure](#-repository-structure)
- [⚡ Quick Start & Local Setup](#-quick-start--local-setup)
- [📡 API Reference & Telemetry Protocol](#-api-reference--telemetry-protocol)
- [📊 Behavioral Science & Pilot Methodology](#-behavioral-science--pilot-methodology)
- [⚙️ Environment Configuration](#️-environment-configuration)
- [🛡️ Reliability & Fail-Safe Design](#️-reliability--fail-safe-design)

---

## 🌟 System Highlights

| Feature | Description |
|---|---|
| **🔬 Scientific A/B Control** | Preserves untouched physical **Control Taps (Tap A)** vs **Intervention Taps (Taps B & C)** to scientifically isolate behavioral savings from extraneous variables. |
| **⏱️ Sub-Second Edge Telemetry** | YF-S201 Hall-effect turbine sensors calibrated to ~450 pulses/liter with sub-second interrupt processing and idle-timeout detection. |
| **🚀 Dual Ingestion Pipeline** | Low-latency **MQTT** telemetry (HiveMQ broker) paired with an authenticated **HTTP REST fallback** (`/api/v1/ingest/telemetry`) with packet deduplication. |
| **🧠 Behavioral Nudge Engine** | Escalating multi-phase interventions: silent baseline, ambient LED rings, acoustic nudges, hostel leaderboards, and public cafeteria scoreboards. |
| **🚨 Continuous Leak Protection** | Configurable volumetric and temporal thresholds that detect unlatched taps, long-tail drips, and pipe ruptures with instant solenoid shutoff. |
| **💻 Glacier Ops Interface** | Modern Next.js 15 enterprise dashboard with DotLottie aquatic visuals, dark-accented telemetry tables, and role-based access control. |

---

## 📸 Live System Showcase

All screenshots below are captured from the **live running TapSense production stack** (ESP32 telemetry simulator + FastAPI ASGI service + MongoDB Atlas + Next.js Glacier Ops UI).

### 1. Aquatic Authentication Portal
Modern, glassmorphic sign-in interface featuring a full-bleed aquatic DotLottie animation reflecting water conservation awareness, credential autofill for role testing, and secure JWT session issuance.

<div align="center">
  <img src="docs/assets/screenshots/01_login_portal.png" alt="TapSense Login Screen" width="95%" style="border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.15);" />
  <p><i>Figure 1: TapSense Secure Authentication Portal with Live Lottie Aquatic Visuals</i></p>
</div>

---

### 2. Executive Operations Dashboard
The mission-control command center displaying real-time campus water metrics: total liters consumed, wasted volume percentage, active flow statuses, live tap telemetry cards, and dynamic conservation scores.

<div align="center">
  <img src="docs/assets/screenshots/02_operations_dashboard.png" alt="Operations Dashboard" width="95%" style="border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.15);" />
  <p><i>Figure 2: Executive Water Operations Dashboard with Real-Time Flow Cards & Metrics</i></p>
</div>

---

### 3. Tap Nodes & Flow Matrix
Comprehensive tap registry separating baseline **Control Taps** from **Intervention Taps**, detailing individual calibration factors (pulses/L), active flow states, cumulative volume, and hardware link status.

<div align="center">
  <img src="docs/assets/screenshots/03_tap_nodes_monitor.png" alt="Tap Nodes Monitor" width="95%" style="border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.15);" />
  <p><i>Figure 3: Tap Nodes Inspector with Scientific Control vs. Intervention Differentiation</i></p>
</div>

---

### 4. Volumetric Flow Sessions & Waste Ledger
Detailed chronological flow session ledger logging start times, run durations, total liters dispensed, wasted long-tail volume, and calculated water efficiency indices per session.

<div align="center">
  <img src="docs/assets/screenshots/04_flow_sessions_telemetry.png" alt="Flow Sessions Ledger" width="95%" style="border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.15);" />
  <p><i>Figure 4: Volumetric Session History with Automated Idle Expiration & Waste Detection</i></p>
</div>

---

### 5. IoT Edge Devices & Telemetry Diagnostics
Microcontroller hardware overview displaying online/offline heartbeats, IP/MAC addresses, firmware versions, active MQTT broker topics, and diagnostic ping latencies.

<div align="center">
  <img src="docs/assets/screenshots/05_edge_devices_hardware.png" alt="IoT Edge Devices" width="95%" style="border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.15);" />
  <p><i>Figure 5: ESP32 Edge Device Telemetry & Infrastructure Health Matrix</i></p>
</div>

---

### 6. Campus Conservation Leaderboard
Gamified inter-hostel and floor-by-floor conservation rankings highlighting daily water savings, efficiency badges, and comparative water usage reductions across academic buildings.

<div align="center">
  <img src="docs/assets/screenshots/06_campus_leaderboard.png" alt="Campus Conservation Leaderboard" width="95%" style="border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.15);" />
  <p><i>Figure 6: Multi-Tier Campus Conservation Leaderboard & Efficiency Rankings</i></p>
</div>

---

### 7. Public Kiosk Signage Display
High-contrast public-facing signage interface engineered for continuous display on cafeteria and hallway monitors to foster communal accountability and collective conservation consciousness.

<div align="center">
  <img src="docs/assets/screenshots/07_public_kiosk_display.png" alt="Public Kiosk Display" width="95%" style="border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.15);" />
  <p><i>Figure 7: Public Signage Kiosk Mode for Dining Halls & Campus Common Areas</i></p>
</div>

---

### 8. Behavioral Science & Interventions
Experimental behavioral nudge management interface controlling visual cues, normative messaging, social comparison triggers, and intervention rollouts.

<div align="center">
  <img src="docs/assets/screenshots/08_behavior_interventions.png" alt="Behavioral Science Interventions" width="95%" style="border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.15);" />
  <p><i>Figure 8: Behavioral Interventions & Nudge Campaign Configuration</i></p>
</div>

---

### 9. Scientific Pilot Phases Tracker
End-to-end multi-phase rollout protocol (Phases 1 through 20) verifying baseline stability, bucket calibration accuracy, statistical significance thresholds, and facility readiness checklists.

<div align="center">
  <img src="docs/assets/screenshots/09_pilot_phases_science.png" alt="Pilot Phases Tracker" width="95%" style="border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.15);" />
  <p><i>Figure 9: Scientific Pilot Phase Tracker & Operational Gateways</i></p>
</div>

---

### 10. Facility Thresholds & Automated Shutoffs
Emergency continuous flow, volume ceiling, and after-hours duration rule configuration with automated solenoid valve shutoff triggers.

<div align="center">
  <img src="docs/assets/screenshots/10_facility_thresholds.png" alt="Facility Thresholds" width="95%" style="border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.15);" />
  <p><i>Figure 10: Facility Safety Rules & Automated Solenoid Cutoff Thresholds</i></p>
</div>

---

### 11. Real-Time Anomaly & Leak Alerts
Live incident alert stream detailing active leaks, unattended taps exceeding threshold durations, and sensor tamper events with rapid incident resolution actions.

<div align="center">
  <img src="docs/assets/screenshots/11_realtime_alerts.png" alt="Real-Time Alerts" width="95%" style="border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.15);" />
  <p><i>Figure 11: Real-Time Anomaly Detection & Continuous Flow Alert Stream</i></p>
</div>

---

## 🏛️ System Architecture

TapSense adopts a resilient, decoupled cyber-physical architecture connecting edge embedded hardware to cloud analytics and modern web clients.

```mermaid
flowchart TD
    subgraph EdgeHardware["Edge Physical Layer (ESP32 Pilot)"]
        S1["YF-S201 Flow Sensor · Tap A (Control)"]
        S2["YF-S201 Flow Sensor · Tap B (Intervention)"]
        S3["YF-S201 Flow Sensor · Tap C (Intervention)"]
        ESP["ESP32 Dual-Core Microcontroller<br/>(Pulse Counter · Wi-Fi · MQTT Client)"]
        ACT["Actuators / Feedback<br/>(16x2 I2C LCD · NeoPixel Ring · Solenoid)"]
        S1 -->|GPIO 25 Interrupt| ESP
        S2 -->|GPIO 26 Interrupt| ESP
        S3 -->|GPIO 27 Interrupt| ESP
        ESP -->|I2C / GPIO| ACT
    end

    subgraph IngestionLayer["Ingestion & Broker Layer"]
        MQTT["HiveMQ MQTT Broker<br/>tapsense/pilot/+/telemetry"]
        HTTP["HTTP Ingest Gateway<br/>/api/v1/ingest/telemetry"]
        ESP -->|Primary (MQTT)| MQTT
        ESP -.->|Fallback (HTTP)| HTTP
    end

    subgraph BackendEngine["Backend ASGI Engine (FastAPI)"]
        SUB["MQTT Worker Subscriber"]
        DEDUP["Packet Deduplication & Auth"]
        STATE["Session State Machine<br/>(Idle Timeout: 5s · Long Tail: 5L)"]
        API["FastAPI REST & Auth Services"]
        MQTT --> SUB
        SUB --> DEDUP
        HTTP --> DEDUP
        DEDUP --> STATE
        STATE --> API
    end

    subgraph DataStorage["Persistence & Caching"]
        MONGO[("MongoDB Atlas<br/>Taps · Sessions · Devices · Rollups")]
        REDIS[("Upstash Redis<br/>(Optional Pub/Sub Cache)")]
        API <--> MONGO
        API <--> REDIS
    end

    subgraph FrontendClients["Glacier Ops Interface (Next.js 15)"]
        DASH["Operations Dashboard"]
        LEAD["Hostel Leaderboard"]
        KIOSK["Public Signage Display"]
        ADMIN["Facility Management & Alerts"]
        API --> DASH & LEAD & KIOSK & ADMIN
    end
```

---

## 🔌 Hardware Specification & Electrical Pinouts

The TapSense edge node operates on an **ESP32 DevKit** board powered through an onboard or external 5V regulated supply, reading digital pulse interrupts from YF-S201 turbine flow meters.

### Pinout Mapping

| Function | Hardware / Component | ESP32 GPIO | Pin Mode | Logic Level |
|---|---|:---:|:---:|:---:|
| **Pipe 1 Flow** | YF-S201 (Tap A — **Control**) | **GPIO 25** | Input (Pull-up) | 5V via divider / 3.3V |
| **Pipe 2 Flow** | YF-S201 (Tap B — **Intervention**) | **GPIO 26** | Input (Pull-up) | 5V via divider / 3.3V |
| **Pipe 3 Flow** | YF-S201 (Tap C — **Intervention**) | **GPIO 27** | Input (Pull-up) | 5V via divider / 3.3V |
| **I2C SDA** | 1602 LCD with I2C Backpack (`0x27`) | **GPIO 21** | I2C Data | 3.3V / 5V |
| **I2C SCL** | 1602 LCD with I2C Backpack (`0x27`) | **GPIO 22** | I2C Clock | 3.3V / 5V |
| **Status LED** | Onboard Diagnostics LED | **GPIO 2** | Output | 3.3V |
| **Solenoid Relay** | 12V DC Normally-Open Solenoid | **GPIO 18** | Output | 3.3V Trigger |

### Power Distribution (L7805CV Line)

```
12V DC Barrel Jack (+) ───┬───► [L7805CV Pin 1 (IN)] ───► [Pin 3 (OUT) +5V] ───► Sensor Reds & LCD VCC
                          │
12V DC Barrel Jack (-) ───┴───► [L7805CV Pin 2 (GND)] ───► Common System GND ───► ESP32 GND & Sensor Blacks
```

> [!TIP]
> **Pulse Calibration Factor**: YF-S201 sensors output roughly $450\text{ pulses/liter}$. For production precision, execute bucket calibration (`backend/scripts/set_calibration.py`) to store exact pulses per liter in the tap metadata.

---

## 📁 Repository Structure

```tree
TapSense/
├── backend/                  # FastAPI Backend Microservices
│   ├── app/
│   │   ├── api/              # REST Endpoints (Auth, Ingest, Taps, Sessions, Devices)
│   │   ├── core/             # Settings, JWT Security, Logging
│   │   ├── db/               # MongoDB Motor connection, Index definitions
│   │   ├── models/           # Domain entities & schemas
│   │   ├── mqtt/             # MQTT async subscriber & broker bridge
│   │   ├── services/         # State machine, session closure, analytics
│   │   └── workers/          # Background tasks & daily rollups
│   ├── scripts/              # Seed scripts, simulate ingest, smoke check
│   ├── requirements.txt      # Python dependencies
│   └── .env.example          # Environment template
│
├── frontend/                 # Next.js 15 Glacier Ops Frontend
│   ├── src/
│   │   ├── app/              # App Router pages ((app), leaderboard, visibility, login)
│   │   ├── components/       # UI primitives, Shell, Navigation, Providers, Lottie
│   │   └── lib/              # API clients, TypeScript definitions, Auth storage
│   ├── public/               # Static assets & animations
│   ├── package.json          # Node dependencies
│   └── tailwind.config.ts    # Design tokens & color system
│
├── firmware/                 # Microcontroller Source Code
│   ├── tapsense_pilot/       # Canonical ESP32 pilot code (Wi-Fi + MQTT + Fallback)
│   ├── tapsense_bench/       # Bench-testing firmware (USB + LCD display)
│   └── tapsense_single_tap/  # Minimal standalone test harness
│
├── hardware/                 # Wiring schematics, connections, and build plans
│   ├── CONNECTIONS.md        # Pinout wiring guide
│   └── HARDWARE-BUILD-PLAN.md# Fabrication & assembly guide
│
└── docs/                     # Scientific plans, phase logs & templates
    ├── assets/screenshots/   # High-resolution UI captures
    └── MVP-COMPLETE.md       # Milestones and verification checklists
```

---

## ⚡ Quick Start & Local Setup

### Prerequisites

- **Python 3.12+**
- **Node.js 18+** & **npm 9+**
- **MongoDB Atlas** connection string or local MongoDB instance
- (Optional) **MQTT Broker** (e.g., `broker.hivemq.com` or local Mosquitto)

---

### 1. Clone & Setup Workspace

```bash
git clone https://github.com/your-org/TapSense.git
cd TapSense
```

---

### 2. Configure & Run Backend

```bash
cd backend

# Create and activate virtual environment
python -m venv .venv

# Windows
.\.venv\Scripts\activate
# Linux/macOS
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
copy .env.example .env   # (or cp .env.example .env on Linux/macOS)

# Populate database with pilot taps, device, and admin user
python -m scripts.seed

# Launch FastAPI server
uvicorn app.main:app --reload --port 8000
```

> **Backend API is now live at:** `http://127.0.0.1:8000`  
> **Interactive Swagger Documentation:** `http://127.0.0.1:8000/docs`

---

### 3. Configure & Run Frontend

Open a new terminal window:

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
copy .env.example .env.local  # NEXT_PUBLIC_API_URL=http://localhost:8000

# Start Next.js development server
npm run dev
```

> **Web App is now live at:** `http://localhost:3000`  
> **Default Login Credentials:**
> - **Email:** `admin@tapsense.app`
> - **Password:** `TapSenseAdmin123!`

---

### 4. Simulate Live Telemetry

To generate live tap flow events without physical hardware attached:

```bash
cd backend
python -m scripts.simulate_ingest
```

This simulates active water dispensing across `tap_a`, `tap_b`, and `tap_c`, triggers session creation, closes idle flows, and updates real-time liters immediately in the dashboard!

---

### 5. Automated System Smoke Test

Run the full end-to-end verification suite:

```bash
cd backend
python -m scripts.smoke_check
```

---

## 📡 API Reference & Telemetry Protocol

### Ingest Endpoint: `POST /api/v1/ingest/telemetry`

Hardware devices push flow packets over HTTP when MQTT is disconnected or as an alternative protocol.

#### Request Headers
```http
Content-Type: application/json
X-Device-Api-Key: tapsense-device-key-9a4e2c8f1b6d0e3a7c5f2b8d1e4a9c6f
```

#### Request Payload
```json
{
  "device_id": "device_01",
  "tap_id": "tap_b",
  "liters_delta": 0.45,
  "session_liters": 1.35,
  "session_end": false,
  "message_id": "esp32-pkt-b71029e-1082",
  "ts": 1794849484
}
```

#### Response (`200 OK`)
```json
{
  "accepted": true,
  "duplicate": false,
  "detail": "ok",
  "reading_id": "4e191d69-bb0c-4d16-b7d2-476b4a06f759",
  "session_id": "c552986f-def7-4c65-bcb1-10f5aa7684a5",
  "session_closed": false,
  "daily_date": null
}
```

### Core API Endpoints

| Method | Endpoint | Description | Auth Required |
|---|---|---|:---:|
| `GET` | `/health` | Ingestion & database health check | ❌ |
| `POST` | `/api/v1/auth/login` | Issues JWT token from credentials | ❌ |
| `GET` | `/api/v1/overview` | Aggregated real-time metrics & active flow | ✅ |
| `GET` | `/api/v1/taps` | Retrieves all registered tap nodes | ✅ |
| `GET` | `/api/v1/sessions` | Retrieves paginated water session logs | ✅ |
| `GET` | `/api/v1/devices` | Returns connected edge hardware nodes | ✅ |
| `GET` | `/api/v1/leaderboard` | Returns building/floor conservation scores | ✅ |
| `GET` | `/api/v1/visibility/summary`| Public kiosk consumption metrics | ❌ |
| `GET` | `/api/v1/thresholds` | Solenoid shutoff & alert thresholds | ✅ |
| `GET` | `/api/v1/alerts` | Incident stream of active leaks & alarms | ✅ |

---

## 📊 Behavioral Science & Pilot Methodology

TapSense is structured around a rigorous **20-Phase Scientific Research Roadmap** designed to measure human-water interaction patterns and quantify nudge efficacy without confounding factors.

```mermaid
flowchart LR
    P0["Phase 0: Silent Baseline<br/>(14 Days · No Nudges)"] --> P1["Phase 1: Real-time Feedback<br/>(Visual NeoPixel Prompts)"]
    P1 --> P2["Phase 2: Social Comparison<br/>(Floor Leaderboards)"]
    P2 --> P3["Phase 3: Public Transparency<br/>(Dining Hall Kiosks)"]
    P3 --> P4["Phase 4: Institutional Scale<br/>(Automated Safety Shutoffs)"]
```

### The Controlled A/B Paradigm
- **Tap A (Control)**: Monitored continuously with flow sensors, but installed without any visual, acoustic, or social feedback. Establishes the baseline behavioral trend unaffected by campaigns.
- **Taps B & C (Intervention)**: Equipped with escalating behavioral feedback mechanisms.
- **The Hawthorne Shield**: During Phase 0, all logging runs completely silently so occupants remain unaware of observation, ensuring pristine pre-intervention consumption data.

---

## ⚙️ Environment Configuration

### Backend (`backend/.env`)

| Variable | Description | Example / Default |
|---|---|---|
| `APP_NAME` | Service label | `TapSense API` |
| `APP_ENV` | Environment mode | `development` / `production` |
| `MONGODB_URI` | MongoDB connection URI | `mongodb+srv://user:pass@cluster.mongodb.net/tapsense` |
| `MONGODB_DB` | Database name | `tapsense` |
| `JWT_SECRET` | Secret key for JWT signing | `tapsense-jwt-secret-key-32chars` |
| `DEVICE_API_KEY` | Shared secret for edge devices | `tapsense-device-key-9a4e2c8f...` |
| `MQTT_HOST` | MQTT broker hostname | `broker.hivemq.com` |
| `MQTT_PORT` | MQTT broker port | `1883` |
| `SESSION_IDLE_SECONDS`| Idle gap before closing a session | `5` |
| `LONG_TAIL_LITERS` | Volume threshold marking waste | `5.0` |

### Frontend (`frontend/.env.local`)

| Variable | Description | Example / Default |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Base URL pointing to FastAPI | `http://localhost:8000` |

---

## 🛡️ Reliability & Fail-Safe Design

1. **Edge Packet Deduplication**: Every telemetry payload includes a UUID `message_id`. Replays from network retries are accepted idempotently without corrupting volumetric totals.
2. **Offline Hardware Spooling**: If local Wi-Fi drops, the ESP32 buffers flow interrupts in RTC memory and flushes them sequentially upon reconnecting.
3. **Plumbing Safety Default**: Solenoid valves are **normally open (NO)** by default so power interruptions never disrupt essential campus sanitation.
4. **Timezone Uniformity**: All campus logs are normalized to `Asia/Kolkata` with UTC timestamps in storage.

---

<div align="center">

**TapSense IoT Project** • Engineering Clean Water Sustainability for Tomorrow's Campuses  
*Designed for Smart Facilities, Campus Sustainability Offices, and IoT Engineering Research.*

</div>
