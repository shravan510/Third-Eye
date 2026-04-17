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

global_frame_buffer = None
current_processing_thread = None
stop_processing_flag = False

def notify_backend(violation_data):
    # Dummy implementation for now, should hit backend API
    try:
        pass # requests.post('http://localhost:3000/api/violations', json=violation_data)
    except:
        pass

def video_processing_loop(camera_config):
    global global_frame_buffer, stop_processing_flag
    source = VideoSource(camera_config)
    print(f"[*] Started processing loop for: {camera_config.get('source_path')}")
    
    speed_limit = camera_config.get('speed_limit_kmh', 40)
    camera_id = camera_config.get('id', 'CAM_001')
    
    frame_count = 0
    while not stop_processing_flag:
        ret, frame = source.read_frame()
        if not ret:
            if source.source_type == "image":
                time.sleep(0.1)
                continue
            elif source.loop:
                time.sleep(0.1)
                continue
            else:
                break
            
        frame_count += 1
        
        if frame_count % frame_skip == 0 or source.source_type == "image":
            results = detector.detect(frame)
            tracks = tracker.extract_tracks(results)
            
            current_track_ids = set()
            
            for t in tracks:
                t_id = t['track_id']
                if not t.get('lost', False):
                    current_track_ids.add(t_id)
                
                x1, y1, x2, y2 = map(int, t['bbox'])
                cx, cy = (x1 + x2) / 2.0, y2 # use bottom-center for speed
                
                # estimate speed
                speed = speed_est.estimate(t_id, cx, cy, frame_time=time.time())
                
                # Check violations (mocking persons_on_bike=2, helmet=False for demo purposes if motorcycle)
                persons = 2 if t['class_name'] == 'motorcycle' else 0
                helmet = False
                
                violations = classifier.check_violations(t_id, t['class_name'], speed, speed_limit, persons_on_bike=persons, helmet_detected=helmet)
                for v in violations:
                    evidence_handler.mark_violation(t_id, v)
                    
                evidence_handler.update_frame(t_id, frame, t['bbox'])
                
                # Draw
                color = (0, 0, 255) if t.get('lost') else (0, 255, 0)
                cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
                cv2.putText(frame, f"{t['class_name']} {t_id} | {speed:.1f}km/h", (x1, max(y1-10, 0)), cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)
                
            # Process vanished tracks
            all_tracked = list(evidence_handler.track_data.keys())
            for t_id in all_tracked:
                if t_id not in current_track_ids:
                    # Target lost fully
                    img_file, vid_file = evidence_handler.process_vanished_track(camera_id, t_id)
                    if img_file or vid_file:
                        print(f"[!] Saved evidence for {t_id}: {img_file}, {vid_file}")
                        # Could trigger notify_backend() here
                        
        global_frame_buffer = frame
        
    source.release()
    print(f"[*] Stopped processing loop")

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
