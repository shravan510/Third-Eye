# 🚦 Third Eye Traffic Project Overview

**Third Eye Traffic** is a complete, production-ready, full-stack AI traffic violation detection system. It connects to your existing IP/CCTV cameras—or even a smartphone camera—and uses an edge AI engine to detect traffic violations automatically. Whenever a speeding or helmetless violation occurs, the system records it into a database and streams real-time alerts to the RTO Officer's React Dashboard where formal challans are generated.

## System Architecture

```text
IP Camera / Phone Camera
        │
        ▼
[Python FastAPI Inference Server]
  - Receives video frames
  - Runs YOLO26-Nano detection + ByteTrack
  - Computes speed and detects traffic violations
        │
        ▼
[Node.js + Express.js Backend]
  - Logs violations to PostgreSQL
  - Emits real-time Socket.IO alerts
        │
        ▼
[React.js Dashboard — RTO Officer Portal]
  - Live feed and real-time alerts
  - Generates Challan PDF
```

## Supported Violations

1. **Speeding**: Uses Homography matrix estimation against known bounds.
2. **Helmetless Riding**: Pose verification against the driver's bounding box.
3. **Triple Riding**: 3+ person bounding boxes matching to the same motorcycle track trace.
4. **Wrong-Side Driving**: Direction coordinates measured against permissible traffic flow vector.

## Tech Stack Summary

| Component | Tech |
| :--- | :--- |
| **Detection AI** | YOLO26-Nano, ByteTrack |
| **Speed/Scale** | 3x3 Homography Matrix Calibration |
| **OCR Engines** | PaddleOCR v3.4.0 (Indian plates) |
| **AI Backend** | Python, FastAPI |
| **App Backend** | Node.js, Express, Socket.io |
| **Database** | PostgreSQL (Primary), MongoDB (Accounts) |
| **Frontend UI** | React.js, Vite, Maps Leaflet |

## Project Folders

* `/ai_engine`: Python AI processing and FastAPI endpoints.
* `/backend`: Node Express.js SQL/NoSQL storage setup.
* `/docs`: Project manuals and setup information.
* `/frontend`: Dashboard UI written in React.
* `/training`: Scripts to retrain or fine-tune our YOLO models.

## Document Directory
* [**01_INSTALLATION.md**](./01_INSTALLATION.md) — How to bootstrap the project locally
* [**02_RUN_ON_VIDEO_FILE.md**](./02_RUN_ON_VIDEO_FILE.md) — Setup for typical demo operation
* [**03_RUN_ON_SMARTPHONE_CAMERA.md**](./03_RUN_ON_SMARTPHONE_CAMERA.md) — Use your phone as an IP Camera
* [**04_RUN_ON_LAPTOP_WEBCAM.md**](./04_RUN_ON_LAPTOP_WEBCAM.md) — Internal tests mode
* [**05_RUN_ON_RTSP_CAMERA.md**](./05_RUN_ON_RTSP_CAMERA.md) — For production CCTV
* [**06_TRAINING_THE_MODEL.md**](./06_TRAINING_THE_MODEL.md) — How to refine YOLO26 on custom road data
* [**07_USING_THE_DASHBOARD.md**](./07_USING_THE_DASHBOARD.md) — Guide to the frontend CLI component 
* [**08_HARDWARE_GUIDE.md**](./08_HARDWARE_GUIDE.md) — GPU/CPU automatic settings info
* [**09_TROUBLESHOOTING.md**](./09_TROUBLESHOOTING.md) — Problem resolution index
