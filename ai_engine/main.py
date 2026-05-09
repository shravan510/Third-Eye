import logging
import math
from fastapi import FastAPI, BackgroundTasks, HTTPException
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import yaml
import cv2
import threading
import time
import os
import requests

from hardware_manager import get_optimal_device, get_recommended_frame_skip
from video_source import VideoSource
from detector import ObjectDetector
from tracker import ByteTrackerWrapper
from speed_estimator import SpeedEstimator
from calibrator import AutoCalibrator
from violation_classifier import ViolationClassifier
from evidence_handler import EvidenceHandler
from ocr_engine import OCREngine
from helmet_detector import HelmetDetector

app = FastAPI(title="Third Eye Traffic AI Engine")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

config = {}
yaml_path = "config.yaml"
if os.path.exists(yaml_path):
    with open(yaml_path, "r") as f:
        config = yaml.safe_load(f)

device = get_optimal_device()
frame_skip = get_recommended_frame_skip(device) if config.get('inference', {}).get('frame_skip', 'auto') == 'auto' else int(config.get('inference', {}).get('frame_skip', 3))

detector = ObjectDetector(device=device)
tracker = ByteTrackerWrapper(max_age=30)
speed_est = SpeedEstimator(homography_config=config.get('inference', {}).get('homography', {}))
classifier = ViolationClassifier(fps_buffer=config.get('inference', {}).get('violation_frame_buffer', 3))
evidence_handler = EvidenceHandler()
ocr = OCREngine(use_gpu=True if 'cuda' in device else False)
helmet_detector = HelmetDetector()

global_frame_buffer = None
current_processing_thread = None
stop_processing_flag = False

def count_persons_on_vehicle(vehicle_bbox, person_boxes: list) -> int:
    """Count person bounding-box centers that fall inside the vehicle bbox.
    Always returns at least 1 for motorcycles (rider counts even if undetected)."""
    x1, y1, x2, y2 = vehicle_bbox
    count = 0
    for pb in person_boxes:
        px1, py1, px2, py2 = pb
        cx = (px1 + px2) / 2.0
        cy = (py1 + py2) / 2.0
        if x1 <= cx <= x2 and y1 <= cy <= y2:
            count += 1
    return max(count, 1)


def notify_backend(camera_id, track_id, violation_type, speed_kmh, plate_number, location_name, evidence_file_path=None):
    """Send violation to backend. Falls back to localhost when not running in Docker."""
    try:
        # Try Docker service name first, fall back to localhost for local dev
        backend_url = os.getenv('BACKEND_URL', 'http://localhost:3000')
        url = f'{backend_url}/api/violations/ingest'
        data = {
            'camera_id': camera_id,
            'track_id': str(track_id),
            'violation_type': violation_type,
            'speed_kmh': str(round(speed_kmh, 1)) if speed_kmh else '0',
            'plate_number': plate_number or 'UNKNOWN',
            'location_name': location_name,
            'evidence_type': 'image',
        }
        files = {}
        if evidence_file_path and os.path.exists(evidence_file_path):
            files['evidence'] = open(evidence_file_path, 'rb')
        resp = requests.post(url, data=data, files=files, timeout=5)
        if resp.status_code == 201:
            print(f'[OK] Violation logged: {violation_type} track={track_id} plate={plate_number}')
        else:
            print(f'[WARN] Backend returned {resp.status_code}: {resp.text[:200]}')
    except Exception as e:
        print(f'[WARN] Backend notification failed: {e}')

# Tracks that have already been reported (even while still in frame)
# Format: {track_id: set of violation_types already sent to backend}
reported_violations: dict = {}
# Per-track last known speed & plate (updated each frame for immediate reporting)
track_last_speed: dict = {}
track_best_plate: dict = {}


def report_violation_now(camera_id, t_id, vtype, speed, plate, location, frame, bbox):
    """Save evidence immediately and POST to backend without waiting for track to vanish."""
    # Save a snapshot right now
    img_file = evidence_handler.save_image_evidence(camera_id, t_id, frame, bbox, vtype)
    date_str = time.strftime('%Y-%m-%d')
    evidence_path = os.path.join('../evidence', camera_id, date_str, img_file) if img_file else None
    notify_backend(camera_id, t_id, vtype, speed, plate, location, evidence_path)


def video_processing_loop(camera_config):
    global global_frame_buffer, stop_processing_flag, reported_violations, track_last_speed, track_best_plate
    source = VideoSource(camera_config)
    print(f"[*] Started processing loop for: {camera_config.get('source_path')}")

    speed_limit = camera_config.get('speed_limit_kmh', 40)
    camera_id   = camera_config.get('id', 'CAM_001')
    location    = camera_config.get('location_name', config.get('cameras', [{}])[0].get('location_name', 'Unknown'))

    frame_count = 0
    while not stop_processing_flag:
        ret, frame = source.read_frame()
        if not ret:
            if source.source_type in ('image', 'file') and source.loop:
                time.sleep(0.1)
                continue
            elif source.loop:
                time.sleep(0.1)
                continue
            else:
                break

        frame_count += 1

        if frame_count % frame_skip == 0 or source.source_type == 'image':
            results = detector.detect(frame)
            tracks  = tracker.extract_tracks(results)

            current_track_ids = set()

            # Collect all detected person boxes for triple-riding check
            person_boxes = [
                t2['bbox'] for t2 in tracks
                if t2['class_name'] == 'person' and not t2.get('lost', False)
            ]

            for t in tracks:
                t_id  = t['track_id']
                cls   = t['class_name']
                bbox  = t['bbox']

                if not t.get('lost', False):
                    current_track_ids.add(t_id)

                x1, y1, x2, y2 = map(int, bbox)
                cx, cy = (x1 + x2) / 2.0, float(y2)

                # Speed estimation
                speed = speed_est.estimate(t_id, cx, cy, frame_time=time.time())
                track_last_speed[t_id] = speed

                # --- Violation checks (only for relevant vehicle types) ---
                persons = 0
                helmet  = True   # default: assume helmet (safe)

                if cls == 'motorcycle':
                    persons = count_persons_on_vehicle(bbox, person_boxes)
                    # Helmet check only runs on motorcycles
                    helmet = helmet_detector.detect_helmet(frame, bbox)

                new_violations = classifier.check_violations(
                    t_id, cls, speed, speed_limit,
                    persons_on_bike=persons, helmet_detected=helmet
                )

                # --- OCR on plate region for this frame ---
                plate = track_best_plate.get(t_id, 'UNKNOWN')
                if cls in ('motorcycle', 'car', 'truck', 'bus'):
                    y_plate = int(y2 - (y2 - y1) * 0.25)
                    plate_crop = frame[y_plate:y2, x1:x2]
                    if plate_crop.size > 0:
                        ocr_text, conf = ocr.read_plate(plate_crop)
                        if ocr_text and conf > 0.5:
                            track_best_plate[t_id] = ocr_text
                            plate = ocr_text

                # --- Immediately report newly confirmed violations ---
                for vtype in new_violations:
                    evidence_handler.mark_violation(t_id, vtype)
                    key = (t_id, vtype)
                    if key not in reported_violations.get(t_id, set()):
                        reported_violations.setdefault(t_id, set()).add(vtype)
                        print(f'[ALERT] {vtype} confirmed for track {t_id} ({plate})')
                        # Fire-and-forget in background thread so loop isn't blocked
                        threading.Thread(
                            target=report_violation_now,
                            args=(camera_id, t_id, vtype, speed, plate, location, frame.copy(), bbox),
                            daemon=True
                        ).start()

                evidence_handler.update_frame(t_id, frame, bbox)

                # --- Draw overlay ---
                color = (0, 0, 255) if t.get('lost') else (0, 255, 0)
                if reported_violations.get(t_id):
                    color = (0, 140, 255)   # orange = violation confirmed
                cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
                label = f"{cls} {t_id} | {speed:.1f}km/h"
                if reported_violations.get(t_id):
                    label += ' [!]'
                cv2.putText(frame, label, (x1, max(y1 - 10, 0)), cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)

            # --- Clean up state for tracks that have fully vanished ---
            for t_id in list(evidence_handler.track_data.keys()):
                if t_id not in current_track_ids:
                    evidence_handler.process_vanished_track(camera_id, t_id)   # frees memory
                    track_last_speed.pop(t_id, None)
                    track_best_plate.pop(t_id, None)
                    reported_violations.pop(t_id, None)

        global_frame_buffer = frame

    source.release()
    print('[*] Stopped processing loop')

# Auto-start logic
first_cam = config.get('cameras', [{}])[0]
if first_cam.get('source_type') != 'directory':
    threading.Thread(target=video_processing_loop, args=(first_cam,), daemon=True).start()

@app.get("/api/health")
def health():
    return {"status": "ok", "device": device}

@app.get("/api/files")
def list_files():
    first_cam = config.get('cameras', [{}])[0]
    if first_cam.get('source_type') != 'directory':
        return {"error": "Not in directory mode"}
    
    dir_path = first_cam.get('source_path', '')
    if not os.path.exists(dir_path):
        return {"error": f"Directory {dir_path} not found"}
        
    files = []
    valid_exts = {'.mp4', '.avi', '.jpg', '.png'}
    for f in os.listdir(dir_path):
        if os.path.splitext(f)[1].lower() in valid_exts:
            files.append(f)
    return {"files": sorted(files)}

@app.post("/api/process-file/{filename}")
def process_file(filename: str):
    global stop_processing_flag, current_processing_thread
    
    first_cam = config.get('cameras', [{}])[0].copy()
    if first_cam.get('source_type') != 'directory':
        raise HTTPException(status_code=400, detail="Not in directory mode")
        
    dir_path = first_cam.get('source_path', '')
    filepath = os.path.join(dir_path, filename)
    
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="File not found")
        
    if current_processing_thread and current_processing_thread.is_alive():
        stop_processing_flag = True
        current_processing_thread.join(timeout=2)
        
    stop_processing_flag = False
    
    ext = os.path.splitext(filepath)[1].lower()
    first_cam['source_type'] = 'image' if ext in {'.jpg', '.png'} else 'file'
    first_cam['source_path'] = filepath
    first_cam['loop_video'] = False
    
    # reset state
    evidence_handler.track_data.clear()
    tracker.last_known_tracks.clear()
    classifier.reported.clear()
    classifier.violation_counts.clear()
    
    current_processing_thread = threading.Thread(target=video_processing_loop, args=(first_cam,), daemon=True)
    current_processing_thread.start()
    
    return {"status": "Processing started", "file": filename}

def generate_mjpeg():
    global global_frame_buffer
    while True:
        if global_frame_buffer is not None:
            ret, buffer = cv2.imencode('.jpg', global_frame_buffer)
            frame_bytes = buffer.tobytes()
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
        time.sleep(0.05)

@app.get("/api/live-feed/{camera_id}")
def live_feed(camera_id: str):
    return StreamingResponse(generate_mjpeg(), media_type="multipart/x-mixed-replace; boundary=frame")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
