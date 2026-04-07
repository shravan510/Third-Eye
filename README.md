# 🚦 Third Eye Traffic

**Third Eye Traffic** is a production-ready, full-stack AI traffic violation detection system. It leverages existing IP/CCTV cameras (or a smartphone) to track traffic violations in real time, serving warnings and generating official challan PDFs via an interactive dashboard.

## 🚀 Key Features

*   **Real-Time Dashboard**: See live annotated video feeds and real-time alerts.
*   **AI Detection Engine**: Local inference powered by YOLO26-Nano and ByteTrack for minimal latency.
*   **Four Violation Types**:
    1.  **Speeding** — Measured accurately via Homography-based calibration.
    2.  **Helmetless Riding** — Analyzes person/motorcycle bounds via bounding box and pose logic.
    3.  **Triple Riding** — Identifies three or more people overlapping a single motorcycle.
    4.  **Wrong-Side Driving** — Compares the direction vector against allowed traffic flow.
*   **Tamper-Proof Proof Storage**: Saves 5-second video clips (speeding, wrong side) or single frames (helmetless, triple riding) with HMAC-256 signatures for auditing.

## 📁 System Architecture

```text
IP Camera / Phone Camera
        │
        ▼
[Python FastAPI Inference Server] (AI Engine)
  - Processes YOLO26-Nano and ByteTrack
  - Computes exact violation details
        │
        ▼
[Node.js + Express.js Backend]
  - PostgreSQL DB (Saves records)
  - MongoDB (Saves RTO accounts)
        │
        ▼
[React.js Dashboard] (Frontend)
  - Socket.io live updates
  - Heatmap & Challan generator
```

## 🛠 Setup & Documentation

Check the `/docs/` folder for complete step-by-step guides.

*   [**00_PROJECT_OVERVIEW.md**](./docs/00_PROJECT_OVERVIEW.md) — Comprehensive details
*   [**01_INSTALLATION.md**](./docs/01_INSTALLATION.md) — How to bootstrap the project locally
*   [**02_RUN_ON_VIDEO_FILE.md**](./docs/02_RUN_ON_VIDEO_FILE.md) — Setup for typical demo operation
*   [**03_RUN_ON_SMARTPHONE_CAMERA.md**](./docs/03_RUN_ON_SMARTPHONE_CAMERA.md) — Use your phone as an IP Camera
*   [**04_RUN_ON_LAPTOP_WEBCAM.md**](./docs/04_RUN_ON_LAPTOP_WEBCAM.md) — Internal tests mode
*   [**05_RUN_ON_RTSP_CAMERA.md**](./docs/05_RUN_ON_RTSP_CAMERA.md) — For production CCTV
*   [**06_TRAINING_THE_MODEL.md**](./docs/06_TRAINING_THE_MODEL.md) — How to refine YOLO26 on custom road data
*   [**07_USING_THE_DASHBOARD.md**](./docs/07_USING_THE_DASHBOARD.md) — Guide to the frontend CLI component 
*   [**08_HARDWARE_GUIDE.md**](./docs/08_HARDWARE_GUIDE.md) — GPU/CPU automatic settings info
*   [**09_TROUBLESHOOTING.md**](./docs/09_TROUBLESHOOTING.md) — Problem resolution index
