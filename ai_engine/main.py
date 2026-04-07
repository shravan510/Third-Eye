from fastapi import FastAPI, UploadFile, File, Form, BackgroundTasks
from fastapi.responses import StreamingResponse
import uvicorn
import yaml
import cv2
import threading
import time
import os

from hardware_manager import get_optimal_device, get_recommended_frame_skip
from video_source import VideoSource
from detector import ObjectDetector
from tracker import ByteTrackerWrapper
from speed_estimator import SpeedEstimator
from calibrator import AutoCalibrator
from violation_classifier import ViolationClassifier
from evidence_handler import EvidenceHandler
from ocr_engine import OCREngine

app = FastAPI(title="Third Eye Traffic AI Engine")

config = {}
yaml_path = "config.yaml"
if os.path.exists(yaml_path):
    with open(yaml_path, "r") as f:
        config = yaml.safe_load(f)

device = get_optimal_device()
frame_skip = get_recommended_frame_skip(device) if config.get('inference', {}).get('frame_skip', 'auto') == 'auto' else int(config.get('inference', {}).get('frame_skip', 3))

# Global state instances
detector = ObjectDetector(device=device)
tracker = ByteTrackerWrapper()
speed_est = SpeedEstimator()
calibrator = AutoCalibrator()
classifier = ViolationClassifier(fps_buffer=config.get('inference', {}).get('violation_frame_buffer', 3))
evidence_handler = EvidenceHandler()
ocr = OCREngine(use_gpu=True if 'cuda' in device else False)

global_frame_buffer = None

def video_processing_loop(camera_config):
    global global_frame_buffer
    source = VideoSource(camera_config)
    print(f"[*] Started processing loop for camera: {camera_config['id']}")
    
    frame_count = 0
    while True:
        ret, frame = source.read_frame()
        if not ret:
            time.sleep(0.1)
            continue
            
        frame_count += 1
        
        # Inference (skip frames if CPU bounded)
        if frame_count % frame_skip == 0:
            results = detector.detect(frame)
            tracks = tracker.extract_tracks(results)
            
            # Draw tracking bounding boxes on frame for live feed
            for t in tracks:
                x1, y1, x2, y2 = map(int, t['bbox'])
                cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
                cv2.putText(frame, f"{t['class_name']} {t['track_id']}", (x1, max(y1-10, 0)), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)
            
        global_frame_buffer = frame

# Auto-start the loop on boot for the first camera in config
if config and 'cameras' in config and len(config['cameras']) > 0:
    first_cam = config['cameras'][0]
    threading.Thread(target=video_processing_loop, args=(first_cam,), daemon=True).start()

@app.get("/api/health")
def health():
    return {"status": "ok", "device": device, "frame_skip": frame_skip}

def generate_mjpeg(camera_id):
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
    return StreamingResponse(generate_mjpeg(camera_id), media_type="multipart/x-mixed-replace; boundary=frame")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
