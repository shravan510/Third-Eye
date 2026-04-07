# 🚦 MASTER PROMPT — "Third Eye Traffic" Full Project Build

> Copy and paste this entire prompt into your AI coding tool (Cursor, GitHub Copilot Workspace, etc.) to generate the complete project in one shot.

---

## PROJECT OVERVIEW

Build a complete, production-ready, full-stack AI traffic violation detection system called **"Third Eye Traffic"**. This is a cloud-native SaaS platform that uses existing IP/CCTV cameras to automatically detect traffic violations in real time, present evidence to RTO officers via a web dashboard, and generate official challan PDFs upon officer verification.

---

## COMPLETE TECH STACK

| Layer | Technology |
|---|---|
| AI Detection | YOLO26-Nano (`yolo26n.pt`) via Ultralytics Python package |
| Object Tracking | ByteTrack (via Ultralytics built-in tracker) |
| Speed Estimation | 3×3 Homography Matrix — auto-calibrated using detected vehicle dimensions |
| OCR | PaddleOCR v3.4.0 / PaddlePaddle 2026.1.29 (Indian HSRP plate optimized) |
| AI Backend (Python) | FastAPI — handles all inference, called by Node.js backend |
| Main Backend | Node.js + Express.js |
| Frontend | React.js + Axios |
| Primary DB | PostgreSQL — stores all violations, evidence metadata, challan records |
| Secondary DB | MongoDB — stores officer/user accounts, sessions, roles |
| Evidence Storage | Local filesystem (structured folders) — ready for S3 swap later |
| PDF Generation | PDFKit (Node.js) |
| Real-time Push | Socket.IO (violation alerts to dashboard in real time) |
| Auth | JWT (JSON Web Tokens) |
| Video Input | Config-file-driven: local MP4/AVI file, RTSP camera stream, or laptop webcam |
| Hardware (Dev Machine A) | ASUS VivoBook — Intel i7-12700H + Intel Iris Xe (integrated GPU) — CPU/OpenVINO inference |
| Hardware (Dev Machine B) | HP Victus — Ryzen 5 5600H + NVIDIA RTX 2050 — CUDA GPU inference |

---

## SYSTEM ARCHITECTURE & DATA FLOW

```
IP Camera / Phone Camera
        │
        ▼
[Python FastAPI Inference Server]
  - Receives video frames via HTTP multipart or RTSP stream
  - Runs YOLO26-Nano detection on each frame
  - Runs ByteTrack to assign unique vehicle IDs across frames
  - Detects violations:
      • Speeding → uses Homography speed estimation
      • Helmetless riding → pose/person count on motorcycle
      • Triple riding → 3+ persons on single motorcycle
      • Wrong-side driving → direction analysis
  - Crops violating vehicle with bounding box (ONLY violating vehicle gets box)
  - Runs PaddleOCR on license plate region
  - Saves evidence (video clip OR image based on violation type)
  - Returns violation payload to Node.js backend
        │
        ▼
[Node.js + Express.js Backend]
  - Receives violation payload from Python
  - Saves violation record to PostgreSQL
  - Saves officer/user data to MongoDB
  - Emits real-time Socket.IO event to React dashboard
  - Handles officer verification API
  - Generates challan PDF via PDFKit on verification
  - Serves evidence files (video/image) to frontend
        │
        ▼
[React.js Dashboard — RTO Officer Portal]
  - Real-time violation feed (Socket.IO)
  - Evidence viewer (video player or image with bounding box)
  - Violation details panel
  - Officer verification action (Approve / Reject)
  - Challan PDF preview + download
  - Heatmap of high-violation zones
  - Officer login/auth
```

---

## MODULE 1 — PYTHON AI INFERENCE ENGINE

### File Structure
```
/ai_engine/
  main.py                  # FastAPI app entry point
  detector.py              # YOLO26-Nano detection logic
  tracker.py               # ByteTrack integration
  speed_estimator.py       # Homography-based speed with auto-calibration
  ocr_engine.py            # PaddleOCR v3.4.0 license plate reader
  violation_classifier.py  # Rules: speeding, helmet, triple-ride, wrong-side
  evidence_handler.py      # Save video clip or image evidence
  calibrator.py            # Auto-calibration using vehicle real-world dimensions
  hardware_manager.py      # Auto-detects GPU/CPU and configures inference device
  video_source.py          # Handles file / webcam / RTSP / URL video sources
  config.yaml              # Video source + camera configuration (edit before running)
  requirements.txt
```

### Detailed Requirements

#### detector.py
- Load `yolo26n.pt` using `from ultralytics import YOLO`
- Detect classes: `motorcycle`, `person`, `car`, `truck`, `bus`, `license_plate`
- Run inference on each incoming frame
- Return bounding boxes, class labels, confidence scores
- Draw bounding box ONLY on violating vehicles — all other vehicles must have NO box drawn
- Use red bounding box color for violating vehicle
- Add violation label text above the box (e.g., "SPEEDING — 78 km/h")

#### tracker.py
- Use ByteTrack via Ultralytics `model.track(source, tracker="bytetrack.yaml")`
- Assign persistent unique `track_id` to each vehicle across frames
- Maintain a dictionary: `{track_id: {positions: [], timestamps: [], class: "motorcycle"}}`
- Pass track history to speed estimator

#### hardware_manager.py — Auto GPU/CPU Detection
This module runs at startup and configures the optimal inference device automatically. No manual configuration needed — it detects the hardware and sets up accordingly.

```python
import torch
import platform

def get_optimal_device():
    """
    Auto-detects hardware and returns the best inference device.
    
    HP Victus (RTX 2050) → returns "cuda:0"
    ASUS VivoBook (Iris Xe, no CUDA) → returns "cpu" with OpenVINO export hint
    Any machine with MPS (Apple Silicon) → returns "mps"
    Fallback → returns "cpu"
    """
    if torch.cuda.is_available():
        gpu_name = torch.cuda.get_device_name(0)
        vram_gb = torch.cuda.get_device_properties(0).total_memory / 1e9
        print(f"[HW] CUDA GPU detected: {gpu_name} ({vram_gb:.1f} GB VRAM)")
        print(f"[HW] Device set to: cuda:0 — NVIDIA GPU inference enabled")
        return "cuda:0"
    
    elif hasattr(torch.backends, 'mps') and torch.backends.mps.is_available():
        print("[HW] Apple MPS detected — using MPS inference")
        return "mps"
    
    else:
        # Intel integrated GPU path (ASUS VivoBook with Iris Xe)
        # Use CPU inference; optionally export to OpenVINO for ~2x speedup on Intel
        print("[HW] No discrete GPU detected — using CPU inference")
        print("[HW] Tip: For Intel Iris Xe, export model to OpenVINO for faster inference:")
        print("[HW]   model.export(format='openvino'); model = YOLO('yolo26n_openvino_model/')")
        return "cpu"

def get_recommended_frame_skip(device: str) -> int:
    """
    Returns recommended frame_skip based on hardware capability.
    RTX 2050 → process every frame (skip=1)
    Intel Iris Xe / CPU → process every 3rd frame (skip=3) to maintain real-time speed
    """
    if "cuda" in device or "mps" in device:
        return 1   # GPU: process every frame
    return 3       # CPU: skip frames to stay real-time
```

- At startup, call `device = get_optimal_device()` and pass to YOLO: `model = YOLO("yolo26n.pt"); model.to(device)`
- Also call `get_recommended_frame_skip(device)` to set the frame processing rate
- Log hardware info to console at startup so the examiner can see which device is being used
- For the ASUS laptop (CPU path), also try loading an OpenVINO-exported version if it exists at `yolo26n_openvino_model/` — this gives ~2x speedup on Intel Iris Xe without needing CUDA

#### video_source.py — Multi-Source Video Handler
Reads from `config.yaml` and provides a unified frame generator regardless of source type. Handles real-time throttling for file playback so violations appear at natural speed.

```python
import cv2
import time

class VideoSource:
    def __init__(self, camera_config):
        source_type = camera_config['source_type']
        source_path = camera_config['source_path']
        self.loop = camera_config.get('loop_video', True)
        self.realtime_playback = camera_config.get('realtime_playback', True)
        self.source_type = source_type
        self.last_frame_time = None
        self.frame_interval = None  # seconds between frames for real-time throttle

        if source_type == "ip_webcam":
            # Android IP Webcam app — connect to phone's HTTP MJPEG stream
            # URL format: http://<phone-ip>:8080/video
            # The app also provides: /shot.jpg (snapshot), /audio.wav, /sensors.json
            print(f"[SOURCE] Connecting to IP Webcam: {source_path}")
            print(f"[SOURCE] Make sure phone and laptop are on the SAME WiFi network")
            self.cap = cv2.VideoCapture(source_path)
            if not self.cap.isOpened():
                raise ConnectionError(
                    f"Cannot connect to IP Webcam at {source_path}\n"
                    f"Check: 1) IP Webcam app is running on phone\n"
                    f"       2) Phone and laptop on same WiFi\n"
                    f"       3) IP address matches what app shows\n"
                    f"       4) URL format: http://192.168.x.x:8080/video"
                )

        elif source_type == "file":
            # Local video file — throttled to real video FPS
            print(f"[SOURCE] Loading video file: {source_path}")
            self.cap = cv2.VideoCapture(source_path)
            if not self.cap.isOpened():
                raise FileNotFoundError(f"Video file not found: {source_path}")
            # Get native FPS of the video to throttle playback
            native_fps = self.cap.get(cv2.CAP_PROP_FPS) or 25
            self.frame_interval = 1.0 / native_fps
            print(f"[SOURCE] Video FPS: {native_fps:.1f} — real-time playback enabled")

        elif source_type == "webcam":
            print(f"[SOURCE] Opening webcam index: {source_path}")
            self.cap = cv2.VideoCapture(int(source_path))
            self.cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
            self.cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)

        elif source_type == "rtsp":
            print(f"[SOURCE] Connecting to RTSP stream: {source_path}")
            self.cap = cv2.VideoCapture(source_path, cv2.CAP_FFMPEG)

    def read_frame(self):
        """
        Returns next frame. For file sources with realtime_playback=true,
        throttles reads to match actual video FPS so the demo feels live.
        """
        # Throttle to real video speed for file playback
        if self.source_type == "file" and self.realtime_playback and self.frame_interval:
            now = time.time()
            if self.last_frame_time:
                elapsed = now - self.last_frame_time
                wait = self.frame_interval - elapsed
                if wait > 0:
                    time.sleep(wait)
            self.last_frame_time = time.time()

        ret, frame = self.cap.read()

        # Loop video file when it ends
        if not ret and self.loop and self.source_type == "file":
            self.cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
            self.last_frame_time = None
            ret, frame = self.cap.read()

        return ret, frame

    def get_source_info(self) -> dict:
        """Returns source metadata for dashboard display."""
        return {
            "source_type": self.source_type,
            "width": int(self.cap.get(cv2.CAP_PROP_FRAME_WIDTH)),
            "height": int(self.cap.get(cv2.CAP_PROP_FRAME_HEIGHT)),
            "fps": self.cap.get(cv2.CAP_PROP_FPS),
        }

    def release(self):
        self.cap.release()
```

**IP Webcam App Setup Guide** (include in README):
```
SMARTPHONE AS CCTV CAMERA — SETUP STEPS
========================================
1. Install "IP Webcam" by Pavel Khlebovich from Google Play Store (Android)
   - iOS alternative: "EpocCam" or "DroidCam"
2. Open app → scroll to bottom → tap "Start server"
3. Note the URL shown on screen, e.g.: http://192.168.1.5:8080
4. In config.yaml, set:
     source_type: "ip_webcam"
     source_path: "http://192.168.1.5:8080/video"
5. Mount phone on a stand pointing at the road/demo area
6. Make sure phone and laptop are on the same WiFi network
7. Run: python main.py

TIPS FOR GOOD DEMO FOOTAGE:
- Use the phone's rear camera (higher quality)
- In IP Webcam settings: set quality to 60-70%, resolution to 720p
- Position phone at an angle (like a CCTV), not straight down
- Good lighting helps OCR read license plates accurately
```
- Use known real-world dimensions of standard Indian vehicles as reference:
  - Motorcycle length: ~2.1 meters
  - Car length: ~4.2 meters
  - Truck length: ~7.5 meters
- When a vehicle is first detected, calculate pixels-per-meter ratio:
  `pixels_per_meter = detected_bounding_box_height_pixels / known_vehicle_length_meters`
- Refine this ratio across multiple detections using a running average
- Output: a calibrated `homography_matrix` (3×3) mapping pixel coordinates to real-world (X, Y) in meters
- Store one calibration per camera_id; update dynamically every 100 frames

#### speed_estimator.py
- For each tracked vehicle, use the calibrated homography matrix:
  - Transform bounding box center pixel `(u, v)` → real-world `(X, Y)` in meters
  - Calculate displacement: `distance = sqrt((X2-X1)² + (Y2-Y1)²)` meters
  - Calculate time delta between frames using timestamps
  - `speed_kmh = (distance / time_delta_seconds) * 3.6`
- Apply Kalman-filter smoothing to reduce noise spikes
- Flag vehicle as SPEEDING if `speed_kmh > speed_limit` (configurable per camera)
- Default speed limit: 40 km/h (urban), 60 km/h (highway) — configurable

#### violation_classifier.py
- **SPEEDING**: speed_kmh > configured limit for that camera
- **HELMETLESS RIDING**: motorcycle detected with person detected on it but no helmet class detected on the person's head region. Use YOLO26 pose keypoints for head detection.
- **TRIPLE RIDING**: motorcycle track_id has 3 or more associated person bounding boxes overlapping it in the same frame
- **WRONG SIDE**: vehicle's direction vector (from track history) is opposite to the configured allowed traffic direction for that camera lane
- Each violation must persist for at least 3 consecutive frames before being flagged (reduces false positives)

#### evidence_handler.py
- **Video violations (SPEEDING, WRONG-SIDE)**:
  - Save a 5-second video clip: 2 seconds before violation + 3 seconds after
  - Format: MP4, 720p minimum
  - Filename: `violation_{track_id}_{timestamp}.mp4`
- **Image violations (HELMETLESS, TRIPLE-RIDING)**:
  - Save single high-quality frame as JPEG
  - The frame must show the violating vehicle with its red bounding box
  - Also save a cropped license plate image separately
  - Filename: `violation_{track_id}_{timestamp}.jpg` and `plate_{track_id}_{timestamp}.jpg`
- Store in: `/evidence/{camera_id}/{date}/`

#### ocr_engine.py
- Install: `pip install paddlepaddle==2026.1.29 paddleocr==3.4.0`
- Use PaddleOCR v3.4.0: `from paddleocr import PaddleOCR`
- Initialize with `lang='en'`, `use_angle_cls=True`, `use_gpu=False` (auto-switch to True if CUDA detected)
- Optimized for Indian HSRP plates
- Input: cropped license plate image region from detector
- Post-process output: strip spaces, normalize to standard format `MH12AB1234`
- Return: `{plate_number: "MH12AB1234", confidence: 0.94}`
- If confidence < 0.6, return `{plate_number: "UNREADABLE", confidence: score}`

#### main.py — FastAPI Endpoints
```
POST /api/process-frame
  Body: multipart form — frame image + camera_id + timestamp
  Returns: {violations: [...], frame_annotated: base64}

POST /api/process-stream  
  Body: {rtsp_url: "...", camera_id: "..."}
  Starts background stream processing (RTSP camera)

POST /api/start-video
  Body: {camera_id: "..."}
  Reads source from config.yaml and starts processing (file or webcam)

GET  /api/live-feed/{camera_id}
  Returns: multipart/x-mixed-replace MJPEG stream of annotated frames
  Used by React dashboard to show live annotated video feed

GET /api/health
  Returns: {status: "ok", model: "yolo26n", device: "cuda|cpu|openvino", version: "1.0"}
```

#### config.yaml — Video Source Configuration
```yaml
# ============================================================
#   THIRD EYE TRAFFIC — VIDEO SOURCE CONFIGURATION
#   Edit ONLY this file to switch input source.
#   No code changes needed.
# ============================================================

cameras:
  - id: "CAM_001"
    name: "Sangli Main Road Demo"
    speed_limit_kmh: 40
    traffic_direction: "north"
    location_name: "Sangli, Maharashtra"
    gps_lat: 16.8524
    gps_lng: 74.5815

    # --- CHOOSE ONE SOURCE TYPE (uncomment one block) ---

    # ✅ OPTION 1: Smartphone as IP Webcam (RECOMMENDED for college demo)
    # Install "IP Webcam" app on Android phone → Start Server → copy the URL shown
    # Make sure phone and laptop are on the SAME WiFi network
    source_type: "ip_webcam"
    source_path: "http://192.168.1.5:8080/video"
    # ↑ Replace IP with the one shown in the IP Webcam app on your phone

    # ✅ OPTION 2: Local video file — plays at real video speed (not fast-forwarded)
    # The system reads the video FPS and throttles processing to match real time
    # source_type: "file"
    # source_path: "./demo_videos/sangli_traffic.mp4"

    # Option 3: Laptop webcam
    # source_type: "webcam"
    # source_path: 0

    # Option 4: RTSP IP camera (real deployment)
    # source_type: "rtsp"
    # source_path: "rtsp://192.168.1.100:554/stream"

inference:
  loop_video: true           # Loop video file when it ends (good for demo)
  realtime_playback: true    # When source_type=file, throttle to real video FPS
                             # so violations appear at natural timing, not instantly
  frame_skip: auto           # "auto" = let hardware_manager.py decide based on GPU/CPU
                             # Or set manually: 1 = every frame, 3 = every 3rd frame
  confidence_threshold: 0.45
  violation_frame_buffer: 3  # Frames before flagging violation (false positive filter)
```

---

## MODULE 2 — MODEL TRAINING PIPELINE

### File Structure
```
/training/
  1_data_collection.md       # Guide: where to get Indian traffic datasets
  2_dataset_preparation.py   # Resize, split train/val/test (80/10/10)
  3_data_augmentation.py     # Augmentation pipeline for Indian road conditions
  4_train.py                 # Fine-tune YOLO26-Nano on custom dataset
  5_evaluate.py              # mAP, precision, recall evaluation
  6_export.py                # Export to ONNX for production
  dataset.yaml               # YOLO dataset config
  requirements_training.txt
```

### Dataset Requirements
Collect minimum 500 images of Indian traffic (Sangli/Pune conditions):
- Classes to annotate: `motorcycle`, `person`, `car`, `truck`, `bus`, `helmet`, `license_plate`
- Recommended sources:
  - Roboflow Universe (search: "Indian traffic", "helmet detection", "license plate India")
  - KAGGLE: "Indian Vehicle Dataset", "Helmet Detection Dataset"
  - Manual collection from Sangli road footage (label using LabelImg or Roboflow)

### dataset.yaml
```yaml
path: ./datasets/third_eye_traffic
train: images/train
val: images/val
test: images/test

nc: 7
names: ['motorcycle', 'person', 'car', 'truck', 'bus', 'helmet', 'license_plate']
```

### train.py
```python
from ultralytics import YOLO

# Load YOLO26-Nano pretrained
model = YOLO("yolo26n.pt")

# Fine-tune on custom dataset
model.train(
    data="dataset.yaml",
    epochs=100,
    imgsz=640,
    batch=16,
    lr0=0.001,
    optimizer="MuSGD",       # YOLO26's new optimizer
    augment=True,
    mosaic=1.0,
    mixup=0.1,
    degrees=10.0,            # Rotation augmentation for angled cameras
    flipud=0.0,
    fliplr=0.5,
    hsv_h=0.015,
    hsv_s=0.7,
    hsv_v=0.4,
    project="runs/train",
    name="third_eye_v1",
    patience=20,
    save=True,
    device="0"               # GPU; use "cpu" if no GPU
)
```

### Augmentation Strategy (3_data_augmentation.py)
Add augmentations specific to Indian road conditions:
- Rain/fog overlay simulation
- Night-time brightness reduction
- Motion blur (moving vehicles)
- Perspective distortion (angled CCTV cameras)
- Overexposure (midday sun glare)
Use Albumentations library for custom augmentations.

---

## MODULE 3 — NODE.JS + EXPRESS.JS BACKEND

### File Structure
```
/backend/
  server.js                  # Entry point
  /config/
    db.postgres.js           # PostgreSQL connection (pg / Sequelize)
    db.mongo.js              # MongoDB connection (Mongoose)
    socket.js                # Socket.IO setup
  /models/
    postgres/
      Violation.js           # Sequelize model
      Camera.js              # Camera registry
      Challan.js             # Generated challans
      Evidence.js            # Evidence file metadata
    mongo/
      Officer.js             # Mongoose model
      Session.js
  /routes/
    violations.routes.js
    officers.routes.js
    challans.routes.js
    cameras.routes.js
    auth.routes.js
  /controllers/
    violations.controller.js
    challans.controller.js
    auth.controller.js
  /middleware/
    auth.middleware.js        # JWT verification
    upload.middleware.js      # Multer for evidence files
  /services/
    challan.pdf.service.js    # PDFKit challan generation
    python.bridge.service.js  # Calls Python FastAPI
    socket.service.js         # Emit real-time events
  /utils/
    hmac.util.js              # HMAC signing for evidence integrity
  package.json
  .env.example
```

### PostgreSQL Schema

#### violations table
```sql
CREATE TABLE violations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  camera_id VARCHAR(50) NOT NULL,
  track_id VARCHAR(50) NOT NULL,
  violation_type VARCHAR(50) NOT NULL,  -- 'SPEEDING' | 'HELMETLESS' | 'TRIPLE_RIDING' | 'WRONG_SIDE'
  violation_description TEXT,
  plate_number VARCHAR(20),
  plate_confidence DECIMAL(4,2),
  speed_kmh DECIMAL(6,2),
  speed_limit_kmh DECIMAL(6,2),
  location_name VARCHAR(200),
  gps_lat DECIMAL(10,7),
  gps_lng DECIMAL(10,7),
  evidence_type VARCHAR(10),           -- 'video' | 'image'
  evidence_path TEXT,
  plate_image_path TEXT,
  hmac_signature VARCHAR(64),          -- HMAC-SHA256 for tamper detection
  status VARCHAR(20) DEFAULT 'PENDING', -- 'PENDING' | 'VERIFIED' | 'REJECTED'
  officer_id VARCHAR(50),
  verified_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE cameras (
  id VARCHAR(50) PRIMARY KEY,
  location_name VARCHAR(200),
  gps_lat DECIMAL(10,7),
  gps_lng DECIMAL(10,7),
  speed_limit_kmh DECIMAL(6,2) DEFAULT 40,
  traffic_direction VARCHAR(10),       -- 'north' | 'south' | 'east' | 'west'
  is_active BOOLEAN DEFAULT TRUE,
  rtsp_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE challans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  violation_id UUID REFERENCES violations(id),
  officer_id VARCHAR(50),
  vehicle_number VARCHAR(20),
  violation_type VARCHAR(50),
  violation_description TEXT,
  evidence_thumbnail_path TEXT,
  timestamp TIMESTAMP,
  location_name VARCHAR(200),
  camera_id VARCHAR(50),
  pdf_path TEXT,
  generated_at TIMESTAMP DEFAULT NOW()
);
```

### MongoDB Schema (Mongoose)

#### Officer Model
```javascript
const officerSchema = new mongoose.Schema({
  officer_id: { type: String, unique: true, required: true },
  name: { type: String, required: true },
  badge_number: { type: String, unique: true },
  email: { type: String, unique: true },
  password_hash: String,
  role: { type: String, enum: ['officer', 'supervisor', 'admin'], default: 'officer' },
  station: String,
  is_active: { type: Boolean, default: true },
  last_login: Date,
  created_at: { type: Date, default: Date.now }
});
```

### Key API Endpoints

#### Violations
```
GET    /api/violations              → list all (with filters: status, type, date, camera_id)
GET    /api/violations/:id          → single violation with full evidence metadata
POST   /api/violations/ingest       → called by Python AI engine to submit new violation
PATCH  /api/violations/:id/verify   → officer verifies (status: VERIFIED) → triggers challan
PATCH  /api/violations/:id/reject   → officer rejects (status: REJECTED)
GET    /api/violations/:id/evidence → serve evidence file (video or image)
```

#### Challans
```
GET    /api/challans                → list all generated challans
GET    /api/challans/:id            → single challan
GET    /api/challans/:id/pdf        → stream PDF download
POST   /api/challans/generate/:violation_id → generate challan PDF
```

#### Auth
```
POST   /api/auth/login              → returns JWT
POST   /api/auth/logout
GET    /api/auth/me                 → current officer info
```

### Socket.IO Events
```javascript
// Server emits to all connected dashboard clients:
socket.emit('new_violation', {
  id, camera_id, violation_type, plate_number, 
  speed_kmh, location_name, evidence_type, created_at
});

socket.emit('violation_verified', { id, challan_id });
socket.emit('violation_rejected', { id });
```

### challan.pdf.service.js — PDFKit Challan Generation
Generate a professional PDF with:
1. **Header**: "Government of Maharashtra — RTO Traffic Violation Notice" with logo placeholder
2. **Section 1 — Vehicle Details**: Vehicle Number (large, prominent), Owner Details Placeholder (fields left blank for RTO server integration later)
3. **Section 2 — Violation Details**: Violation Type (bold), Full Description, Speed recorded vs limit (if speeding)
4. **Section 3 — Evidence**: Embedded evidence thumbnail image (license plate crop + violation frame side by side)
5. **Section 4 — Incident Details**: Timestamp (formatted DD/MM/YYYY HH:MM:SS), Location Name, Camera ID
6. **Section 5 — Verification**: Officer Name, Badge Number, Verification timestamp, Digital signature placeholder
7. **Footer**: "This is a computer-generated document. For queries contact your nearest RTO office."
8. Add HMAC signature reference for tamper-proof verification

### hmac.util.js — Evidence Integrity
```javascript
const crypto = require('crypto');
const SECRET = process.env.HMAC_SECRET;

function signViolation(data) {
  const payload = `${data.violation_id}|${data.plate_number}|${data.speed_kmh}|${data.created_at}`;
  return crypto.createHmac('sha256', SECRET).update(payload).digest('hex');
}

function verifyViolation(data, signature) {
  return signViolation(data) === signature;
}
```

---

## MODULE 4 — REACT.JS FRONTEND DASHBOARD

### File Structure
```
/frontend/
  /src/
    /pages/
      Login.jsx
      Dashboard.jsx          # Main real-time violation feed
      ViolationDetail.jsx    # Single violation with evidence + verify/reject
      Challans.jsx           # List of generated challans
      ChallanDetail.jsx      # Preview + download challan PDF
      Heatmap.jsx            # Violation heatmap by location
      CameraManagement.jsx   # Admin: add/configure cameras
    /components/
      ViolationCard.jsx      # Card in feed with type badge, plate, timestamp
      EvidenceViewer.jsx     # Video player or image viewer
      ChallanPDFPreview.jsx  # Embedded PDF preview
      HeatmapWidget.jsx      # Leaflet.js heatmap
      StatsBar.jsx           # Top stats: total today, pending, verified
      NotificationToast.jsx  # Socket.IO new violation toast
      BoundingBoxImage.jsx   # Shows image with pre-drawn bounding box
    /context/
      AuthContext.jsx
      SocketContext.jsx
    /hooks/
      useViolations.js
      useSocket.js
    /services/
      api.js                 # Axios instance with base URL + JWT header
      violations.api.js
      challans.api.js
      auth.api.js
    App.jsx
    index.jsx
```

### Design Requirements — RTO Officer Dashboard
**Theme**: Dark navy/slate background with sharp amber/orange accent colors — giving a "command center" feel appropriate for law enforcement use. Professional, high-contrast, utilitarian but modern.

**Dashboard Layout**:
- **Left Sidebar**: Navigation (Dashboard, Violations, Challans, Heatmap, Cameras), Officer name + badge + logout
- **Top Stats Bar**: Live counts — Violations Today, Pending Review, Verified, Rejected (auto-update via Socket.IO)
- **Main Area**: Real-time violation feed as cards

**ViolationCard.jsx**:
- Violation type badge (color-coded: RED for Speeding, ORANGE for Helmetless, PURPLE for Triple Riding, BLUE for Wrong Side)
- Vehicle number (large, monospace font)
- Camera location
- Timestamp
- Thumbnail preview
- "Review" button → navigates to ViolationDetail

**ViolationDetail.jsx**:
- Full evidence viewer:
  - **Video violations**: HTML5 `<video>` player with controls, autoplay muted
  - **Image violations**: Full image with bounding box already drawn on violating vehicle (bounding box is pre-rendered server-side by Python)
  - License plate crop shown separately in a highlighted panel
- Violation metadata panel: type, description, speed (if applicable), camera ID, location, timestamp
- Two large action buttons:
  - ✅ **VERIFY & ISSUE CHALLAN** (green) → calls verify API → triggers PDF generation → shows success
  - ❌ **REJECT** (red) → calls reject API → removes from pending feed
- After verification: show challan preview inline with download button

**Heatmap.jsx**:
- Use Leaflet.js with Leaflet.heat plugin
- Plot all violation GPS coordinates as a heatmap
- Color intensity = violation count at that location
- Click on hotspot → see list of violations from that location

**Real-time Push (Socket.IO)**:
- Connect on dashboard load using `SocketContext`
- On `new_violation` event → add card to top of feed with a slide-in animation + toast notification
- Badge counter on browser tab updates in real time

**Live Annotated Video Feed (Demo Mode)**:
- A dedicated `LiveFeed.jsx` component embedded in the Dashboard
- Connects to `GET /api/live-feed/{camera_id}` — MJPEG stream from Python FastAPI
- Displays the annotated video with red bounding boxes ONLY on violating vehicles
- Shows camera name, status indicator (LIVE / PROCESSING), and current FPS
- Positioned as a prominent panel in the dashboard so the examiner can see:
  1. The live video on the left (vehicles being detected in real time)
  2. Violation cards appearing on the right as violations are detected
  3. Stats bar at the top updating live (violation counts)
- This gives a complete end-to-end demo view on a single screen

**Demo Mode Banner**:
- When `source_type: "file"` → show amber banner: `"DEMO MODE — Running on local video file | Real-time playback enabled"`
- When `source_type: "ip_webcam"` → show green banner: `"LIVE — Smartphone IP Webcam | http://192.168.x.x:8080"`
- When `source_type: "rtsp"` → show green banner: `"LIVE — IP Camera connected"`
- Banner always shows current FPS and device (CUDA / CPU) in the corner

---

## MODULE 5 — PROJECT CONFIGURATION & SETUP

### .env.example (Backend)
```
PORT=3000
PYTHON_API_URL=http://localhost:8000

# PostgreSQL
PG_HOST=localhost
PG_PORT=5432
PG_DB=third_eye_traffic
PG_USER=postgres
PG_PASSWORD=yourpassword

# MongoDB
MONGO_URI=mongodb://localhost:27017/third_eye_users

# JWT
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=24h

# HMAC
HMAC_SECRET=your_hmac_secret_key_here

# Evidence Storage
EVIDENCE_BASE_PATH=./evidence

# Speed Limits (defaults, overridden per camera)
DEFAULT_URBAN_SPEED_LIMIT=40
DEFAULT_HIGHWAY_SPEED_LIMIT=60
```

### Root Directory Structure
```
/third-eye-traffic/
  /ai_engine/         # Python FastAPI + YOLO26 inference
  /training/          # Model training pipeline
  /backend/           # Node.js + Express.js
  /frontend/          # React.js
  /evidence/          # Evidence files (auto-created)
  docker-compose.yml  # Orchestrates all services
  README.md
```

### docker-compose.yml
```yaml
version: '3.8'
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: third_eye_traffic
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: yourpassword
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  mongodb:
    image: mongo:7
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db

  ai_engine:
    build: ./ai_engine
    ports:
      - "8000:8000"
    volumes:
      - ./evidence:/app/evidence
    depends_on:
      - postgres

  backend:
    build: ./backend
    ports:
      - "3000:3000"
    volumes:
      - ./evidence:/app/evidence
    depends_on:
      - postgres
      - mongodb
      - ai_engine
    env_file:
      - ./backend/.env

  frontend:
    build: ./frontend
    ports:
      - "5173:5173"
    depends_on:
      - backend

volumes:
  postgres_data:
  mongo_data:
```

---

## IMPORTANT IMPLEMENTATION NOTES

1. **Bounding Box Rule (CRITICAL)**: In ALL evidence images and annotated frames sent to the frontend, draw a RED bounding box ONLY on the vehicle that violated the rule. Every other vehicle in the frame must appear without any box. This ensures the officer's attention is immediately drawn to the offender.

2. **Evidence Type Rule**:
   - SPEEDING → 5-second MP4 video clip
   - WRONG-SIDE → 5-second MP4 video clip
   - HELMETLESS RIDING → JPEG image frame
   - TRIPLE RIDING → JPEG image frame

3. **Auto-Calibration Rule**: The Homography matrix must be recalibrated every 100 frames using fresh vehicle dimension measurements. Store calibration state per camera_id. Never assume a fixed calibration across sessions.

4. **HMAC Integrity**: Every violation record saved to PostgreSQL must have its `hmac_signature` field populated before insert. Any GET request for violation detail should verify the HMAC and include `{integrity: "valid" | "tampered"}` in the API response.

5. **False Positive Reduction**: A violation must be detected in at least 3 consecutive frames before the system fires the violation event. Implement this as a frame-count buffer per track_id in the Python engine.

6. **Challan PDF — RTO Integration Placeholder**: In the PDF, all "Owner Details" fields (name, address, Aadhaar) must be rendered as clearly labeled empty boxes with the text "[TO BE FILLED BY RTO SERVER — INTEGRATION PENDING]". This makes it clear the system is ready for RTO server hookup.

7. **PaddleOCR v3.4.0 Indian HSRP Optimization**: Install with `pip install paddlepaddle==2026.1.29 paddleocr==3.4.0`. Initialize PaddleOCR with `use_angle_cls=True` and preprocess the license plate crop with contrast enhancement (CLAHE) before passing to OCR, as Indian plates often have sun glare. Set `use_gpu=True` automatically when CUDA is detected by `hardware_manager.py`.

8. **ByteTrack Configuration**: Use default ByteTrack YAML from Ultralytics. Set `track_high_thresh=0.5`, `track_low_thresh=0.1`, `new_track_thresh=0.6` for optimal performance in dense Indian traffic.

9. **Hardware Auto-Detection (CRITICAL)**: The system must call `hardware_manager.get_optimal_device()` at startup before loading the YOLO model. Never hardcode `device="cuda"` or `device="cpu"`. The same codebase must run on both laptops without any code changes — only the device selection differs.
   - **HP Victus (RTX 2050)**: CUDA path → full 30 FPS processing of every frame
   - **ASUS VivoBook (Iris Xe)**: CPU path → process every 3rd frame, optionally use OpenVINO export for speedup
   - Print a startup banner showing: device name, VRAM (if GPU), recommended frame_skip, and model loaded

10. **College Demo Setup**: Place sample Indian traffic videos in `./demo_videos/`. The README must include links to free Indian traffic footage sources (YouTube Creative Commons, IIT datasets, Roboflow). The `config.yaml` must have the file source pre-configured and commented out alternatives clearly labeled. Running the demo should be as simple as: `python main.py` with no other arguments needed.

11. **Live Feed Streaming**: The `/api/live-feed/{camera_id}` endpoint must stream MJPEG using `StreamingResponse` in FastAPI with `media_type="multipart/x-mixed-replace; boundary=frame"`. This allows the React `<img>` tag to display it as a live video without WebRTC complexity.

12. **IP Webcam Connection Resilience**: For `source_type: "ip_webcam"`, implement auto-reconnect logic — if the stream drops (phone screen locks, WiFi hiccup), the system retries connection every 3 seconds and shows a "Reconnecting..." status on the dashboard instead of crashing.

14. **Rejected Violations — Never Delete, Always Store (CRITICAL)**: When an officer rejects a violation, the record must NEVER be deleted from PostgreSQL. Only the `status` field changes to `'REJECTED'`. This is important for legal audit trails — a senior officer may later review rejected violations and overturn the decision. The system must support:
    - A **"Rejected"** tab in the dashboard violations list showing all rejected violations
    - A **"Re-review"** button on rejected violation detail page — this resets status back to `'PENDING'` and puts it back in the pending feed for any officer to verify
    - All status changes must be logged with `officer_id` + `timestamp` in a separate `violation_status_log` table:
    ```sql
    CREATE TABLE violation_status_log (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      violation_id UUID REFERENCES violations(id),
      old_status VARCHAR(20),
      new_status VARCHAR(20),
      changed_by_officer_id VARCHAR(50),
      reason TEXT,                        -- optional note officer can add
      changed_at TIMESTAMP DEFAULT NOW()
    );
    ```
    - The ViolationDetail page must show the full status history of that violation (e.g., "Pending → Rejected by Officer A at 14:32 → Re-reviewed → Verified by Officer B at 15:10")
    - Only officers with role `'supervisor'` or `'admin'` can re-review rejected violations — regular officers cannot overturn a rejection

15. **Real-Time File Playback (CRITICAL)**: When `source_type: "file"` and `realtime_playback: true`, the system MUST throttle frame processing to match the video's native FPS. Do NOT process frames as fast as possible — that would show all violations instantly and ruin the demo. The examiner must see violations appear naturally over time as the video plays, exactly like watching real CCTV footage.

---

## DELIVERABLES CHECKLIST

When complete, the project must include:
- [ ] `/ai_engine/` — Fully working Python FastAPI inference server
- [ ] `/ai_engine/config.yaml` — Pre-configured for local video file demo
- [ ] `/ai_engine/hardware_manager.py` — Auto GPU/CPU detection for both laptops
- [ ] `/ai_engine/video_source.py` — Unified handler for file/webcam/RTSP/URL
- [ ] `/training/` — Complete training pipeline with instructions
- [ ] `/backend/` — Node.js Express server with all routes, models, PDF generation
- [ ] `/frontend/` — React dashboard with real-time Socket.IO feed + live MJPEG feed panel
- [ ] `docker-compose.yml` — One-command startup for all services
- [ ] `README.md` — Setup instructions, architecture diagram (ASCII or Mermaid), API docs, links to sample Indian traffic videos for demo
- [ ] `.env.example` files for both backend and ai_engine
- [ ] PostgreSQL migration SQL file (`schema.sql`) — including `violations`, `cameras`, `challans`, `violation_status_log` tables
- [ ] Seed data script for creating a default admin officer account
- [ ] `/demo_videos/README.md` — Instructions on where to download Indian traffic sample videos
- [ ] `/docs/` — Step-by-step markdown guide files for running the project (see MODULE 6 below)

---

## MODULE 6 — /docs/ FOLDER (Step-by-Step Run Guides)

Create a `/docs/` folder in the project root containing the following markdown files. Each file must be a complete, beginner-friendly, step-by-step guide. Write them as if explaining to a college student who has never run the project before. Use numbered steps, code blocks for every command, and include screenshots descriptions where helpful.

### Folder Structure
```
/docs/
  00_PROJECT_OVERVIEW.md
  01_INSTALLATION.md
  02_RUN_ON_VIDEO_FILE.md
  03_RUN_ON_SMARTPHONE_CAMERA.md
  04_RUN_ON_LAPTOP_WEBCAM.md
  05_RUN_ON_RTSP_CAMERA.md
  06_TRAINING_THE_MODEL.md
  07_USING_THE_DASHBOARD.md
  08_HARDWARE_GUIDE.md
  09_TROUBLESHOOTING.md
```

---

### 00_PROJECT_OVERVIEW.md
Contents:
- What the project does in simple language (2-3 paragraphs)
- System architecture diagram in ASCII or Mermaid
- List of all violation types detected and how each is detected
- Tech stack summary table
- Folder structure of the entire project explained
- Link to each other doc file with one-line description of what it covers

---

### 01_INSTALLATION.md
Contents:
- Prerequisites checklist:
  - Python 3.10+ installed
  - Node.js 18+ installed
  - PostgreSQL installed and running
  - MongoDB installed and running
  - Git installed
- Step-by-step installation:
  ```
  Step 1: Clone the repository
  Step 2: Set up Python virtual environment for ai_engine
  Step 3: Install Python dependencies (pip install -r requirements.txt)
  Step 4: Install paddlepaddle==2026.1.29 and paddleocr==3.4.0
  Step 5: Download yolo26n.pt model checkpoint (provide download link/command)
  Step 6: Install Node.js dependencies for backend (npm install)
  Step 7: Install Node.js dependencies for frontend (npm install)
  Step 8: Set up PostgreSQL — create database, run schema.sql
  Step 9: Set up MongoDB — just needs to be running, auto-creates collections
  Step 10: Copy .env.example to .env and fill in values
  Step 11: Run seed script to create default admin officer account
  ```
- Separate installation notes for:
  - **HP Victus (RTX 2050)**: Install CUDA toolkit, verify with `nvidia-smi`
  - **ASUS VivoBook (Iris Xe)**: No CUDA needed, optionally export model to OpenVINO for speedup
- Expected output after successful installation (what the terminal should show)

---

### 02_RUN_ON_VIDEO_FILE.md
Contents:
- When to use this mode: college demo, examiner presentation, testing
- Where to get Indian traffic videos (include direct links):
  - Roboflow Universe public datasets
  - YouTube Creative Commons traffic videos (search terms to use)
  - IIT Bombay / IIT Madras public traffic datasets
  - How to download a YouTube video using yt-dlp: exact command
- Step-by-step:
  ```
  Step 1: Place your video file in /demo_videos/ folder
          Supported formats: MP4, AVI, MOV, MKV
          
  Step 2: Open /ai_engine/config.yaml
          Set:
            source_type: "file"
            source_path: "./demo_videos/your_video_name.mp4"
          Also set loop_video: true so it loops for the demo
          
  Step 3: Start PostgreSQL and MongoDB services
  
  Step 4: Start the Python AI engine
          cd ai_engine
          python main.py
          ✅ You should see: "[HW] Device set to: ..." and "[SOURCE] Loading video file..."
          
  Step 5: Start the Node.js backend (new terminal)
          cd backend
          npm run dev
          ✅ You should see: "Server running on port 3000"
          
  Step 6: Start the React frontend (new terminal)
          cd frontend
          npm run dev
          ✅ Open browser: http://localhost:5173
          
  Step 7: Login with default credentials:
          Email: admin@thirdeye.com
          Password: Admin@123
          
  Step 8: Go to Dashboard — you will see:
          - Left panel: video playing with red boxes on violators
          - Right panel: violation cards appearing in real time
          - Top bar: stats updating live
  ```
- What to expect: screenshots described for each step
- How to stop all services cleanly

---

### 03_RUN_ON_SMARTPHONE_CAMERA.md
Contents:
- What you need: Android smartphone + IP Webcam app (free on Play Store)
- Complete phone setup:
  ```
  Step 1: Install "IP Webcam" by Pavel Khlebovich from Google Play Store
  
  Step 2: Open the app
          - Set Video preferences: Resolution → 1280x720, Quality → 60%
          - Set Focuses: Continuous video focus → ON
          - Go to the bottom → tap "Start server"
          
  Step 3: Note the URL shown on screen, example:
          http://192.168.1.5:8080
          
  Step 4: Make sure your phone AND laptop are connected to the SAME WiFi network
          (hotspot from phone also works — connect laptop to phone hotspot)
  ```
- Project configuration:
  ```
  Step 5: Open /ai_engine/config.yaml
          Set:
            source_type: "ip_webcam"
            source_path: "http://192.168.1.5:8080/video"
          Replace 192.168.1.5 with YOUR phone's IP shown in the app
  ```
- Running:
  ```
  Step 6: Start all three services (same as Steps 3-7 in 02_RUN_ON_VIDEO_FILE.md)
  ```
- Phone positioning tips for best results:
  - Mount phone at a height and angle (like a real CCTV — not flat/straight down)
  - Point at a road or area with moving vehicles
  - Good lighting is important for OCR to read number plates
  - Keep phone plugged in (stream drains battery fast)
- Troubleshooting connection issues:
  - Cannot connect → check both devices on same WiFi
  - Laggy stream → reduce quality in IP Webcam app to 40%
  - Stream drops → phone screen locked → disable screen lock while streaming

---

### 04_RUN_ON_LAPTOP_WEBCAM.md
Contents:
- When to use: quick testing, no phone available, indoor demo
- Configuration:
  ```
  Step 1: Open /ai_engine/config.yaml
          Set:
            source_type: "webcam"
            source_path: 0       # 0 = built-in webcam, 1 = external USB webcam
  ```
- Running: same as standard startup steps
- Note: webcam footage is typically forward-facing (at the person sitting), not ideal for traffic detection — best used just for testing that the pipeline works, not for actual violation detection demo
- How to test with a second monitor showing a traffic video while webcam records it (poor man's demo trick)

---

### 05_RUN_ON_RTSP_CAMERA.md
Contents:
- When to use: real IP CCTV camera on a network (future deployment)
- What is RTSP and how IP cameras work (brief explanation)
- Configuration:
  ```
  Step 1: Get your camera's RTSP URL from its manual or admin panel
          Common formats:
          rtsp://192.168.1.100:554/stream
          rtsp://admin:password@192.168.1.100:554/h264/ch1/main/av_stream
          
  Step 2: Open /ai_engine/config.yaml
          Set:
            source_type: "rtsp"
            source_path: "rtsp://your-camera-ip:554/stream"
          Also update: camera name, GPS coordinates, speed limit for that location
  ```
- Running: same as standard startup steps
- Note: RTSP cameras require being on the same network or VPN as the camera
- How to add multiple cameras: duplicate the camera entry in config.yaml with a different `id`

---

### 06_TRAINING_THE_MODEL.md
Contents:
- Why training is needed (pretrained YOLO26 doesn't know Indian traffic specifics)
- Dataset collection guide:
  - Where to download labeled datasets (Roboflow Universe — exact search terms)
  - How to label your own images using Roboflow (free tier is enough)
  - Minimum dataset size: 500 images, recommended: 1000+
  - Class distribution advice: try to have at least 100 images per class
- Step-by-step training:
  ```
  Step 1: Download and place dataset in /training/datasets/third_eye_traffic/
  
  Step 2: Verify dataset structure matches dataset.yaml
  
  Step 3: Run data preparation script
          cd training
          python 2_dataset_preparation.py
          
  Step 4: Run augmentation
          python 3_data_augmentation.py
          
  Step 5: Start training (use HP Victus with RTX 2050 for this — much faster)
          python 4_train.py
          Training takes ~2-4 hours on RTX 2050 for 100 epochs
          On CPU (ASUS): ~12-24 hours — not recommended
          
  Step 6: Evaluate the model
          python 5_evaluate.py
          Target: mAP@0.5 > 0.7 is good for this project
          
  Step 7: Copy the best checkpoint to ai_engine/
          cp runs/train/third_eye_v1/weights/best.pt ../ai_engine/yolo26n.pt
  ```
- What to do if training accuracy is low (tips)
- How to resume interrupted training

---

### 07_USING_THE_DASHBOARD.md
Contents:
- Login page: default credentials
- Dashboard overview with annotated screenshot description:
  - Live feed panel (left)
  - Violation cards panel (right)
  - Stats bar (top)
  - Navigation sidebar (left edge)
- How to review a violation:
  ```
  1. A new violation card appears on the right panel
  2. Click "Review" button on the card
  3. You are taken to the Violation Detail page
  4. Watch the video evidence (for speeding/wrong-side)
     OR view the image evidence (for helmetless/triple-riding)
  5. Check the license plate crop in the highlighted panel
  6. Read the violation metadata (type, speed, location, timestamp)
  7. Click ✅ VERIFY & ISSUE CHALLAN — or — ❌ REJECT
  ```
- How to download a challan PDF after verification
- How to view rejected violations (Rejected tab)
- How supervisors can re-review a rejected violation
- How to view the violation status history/audit trail
- How to use the heatmap page
- How to manage cameras (admin only)

---

### 08_HARDWARE_GUIDE.md
Contents:
- How the system auto-detects your hardware (no manual config needed)
- Expected performance on each laptop:

  | Laptop | GPU | Inference Device | Expected FPS | Frame Skip |
  |---|---|---|---|---|
  | HP Victus | RTX 2050 (4GB VRAM) | CUDA | 25-30 FPS | 1 (every frame) |
  | ASUS VivoBook | Intel Iris Xe | CPU | 8-12 FPS | 3 (every 3rd frame) |

- How to check which device is being used: look at startup log — `[HW] Device set to: cuda:0` or `[HW] Device set to: cpu`
- How to manually override device if needed (env variable: `FORCE_DEVICE=cpu`)
- OpenVINO speedup guide for ASUS (Intel Iris Xe):
  ```
  # Export model to OpenVINO format (one-time, run on any machine)
  cd ai_engine
  python -c "from ultralytics import YOLO; YOLO('yolo26n.pt').export(format='openvino')"
  # This creates yolo26n_openvino_model/ folder
  # The system automatically detects and uses it on Intel hardware
  ```
- RAM usage estimates: ~2GB for full stack on CPU, ~3GB with CUDA

---

### 09_TROUBLESHOOTING.md
Contents — common problems and exact fixes:

```
PROBLEM: "Cannot connect to IP Webcam"
FIX: Check phone and laptop on same WiFi. Try opening http://192.168.x.x:8080
     in laptop browser — if page loads, the URL is correct.

PROBLEM: "yolo26n.pt not found"
FIX: Download the model checkpoint and place it in /ai_engine/ folder.
     Command: [include download command here]

PROBLEM: "CUDA not available" on HP Victus
FIX: Install NVIDIA CUDA Toolkit. Run: nvidia-smi to verify GPU is detected.
     Then reinstall torch with CUDA: pip install torch --index-url https://download.pytorch.org/whl/cu121

PROBLEM: Dashboard shows violations but no live feed
FIX: Check that /api/live-feed/CAM_001 is accessible at http://localhost:8000/api/live-feed/CAM_001
     If not loading, restart the Python ai_engine.

PROBLEM: License plates showing as UNREADABLE
FIX: Improve lighting on the plate. Ensure plate is at least 80x30 pixels in frame.
     For video files, try a higher resolution source video.

PROBLEM: Speed always showing 0 km/h
FIX: The auto-calibration needs at least 10 vehicles to pass through before
     speed estimation becomes accurate. Wait for more vehicles to be detected.

PROBLEM: PostgreSQL connection refused
FIX: Make sure PostgreSQL service is running.
     Windows: net start postgresql
     Linux/Mac: sudo service postgresql start

PROBLEM: Frontend not receiving Socket.IO events
FIX: Check that CORS is configured in backend to allow http://localhost:5173
     Restart both backend and frontend.

PROBLEM: Video file plays too fast / all violations appear instantly
FIX: Make sure realtime_playback: true is set in config.yaml

PROBLEM: "Module not found" errors in Python
FIX: Make sure you activated the virtual environment:
     Windows: venv\Scripts\activate
     Linux/Mac: source venv/bin/activate
     Then run pip install -r requirements.txt again.
```

---

*Project: Third Eye Traffic | Team: Harshvardhan Mane, Shravan Vijaykar, Pratik Pantawane | Guide: Dr. A.R. Surve | WCE Sangli, 2025-26*
