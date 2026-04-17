import cv2
import os
import time
import numpy as np

class EvidenceHandler:
    def __init__(self, base_path="../evidence"):
        self.base_path = base_path
        os.makedirs(base_path, exist_ok=True)
        # track_id -> { 'frames': [...], 'bboxes': [...], 'violation_types': set(), 'active': True }
        self.track_data = {}

    def update_frame(self, track_id, frame, bbox):
        if track_id not in self.track_data:
            self.track_data[track_id] = {
                'frames': [],
                'bboxes': [],
                'violation_types': set(),
                'active': True
            }
        
        # Protect against memory leak if tracking gets stuck
        if len(self.track_data[track_id]['frames']) > 300:
            self.track_data[track_id]['frames'].pop(0)
            self.track_data[track_id]['bboxes'].pop(0)
            
        self.track_data[track_id]['frames'].append(frame.copy())
        self.track_data[track_id]['bboxes'].append(bbox)
        self.track_data[track_id]['active'] = True

    def mark_violation(self, track_id, violation_type):
        if track_id in self.track_data:
            self.track_data[track_id]['violation_types'].add(violation_type)

    def select_best_frame(self, frames, bboxes):
        best_idx = 0
        max_area = 0
        H, W = frames[0].shape[:2]
        
        for i, bbox in enumerate(bboxes):
            x1, y1, x2, y2 = bbox
            area = (x2 - x1) * (y2 - y1)
            margin = 30
            if x1 < margin or y1 < margin or x2 > W - margin or y2 > H - margin:
                area *= 0.5 
                
            if area > max_area:
                max_area = area
                best_idx = i
                
        return frames[best_idx], bboxes[best_idx]

    def process_vanished_track(self, camera_id, track_id):
        if track_id not in self.track_data:
            return None, None
            
        data = self.track_data[track_id]
        if not data['violation_types']:
            del self.track_data[track_id]
            return None, None
            
        frames = data['frames']
        bboxes = data['bboxes']
        violations = list(data['violation_types'])
        
        if not frames:
            del self.track_data[track_id]
            return None, None
            
        best_frame, best_bbox = self.select_best_frame(frames, bboxes)
        image_filename = self.save_image_evidence(camera_id, f"{track_id}_best", best_frame, best_bbox, violations[0])
        video_filename = self.save_video_clip(camera_id, track_id, frames, bboxes, violations[0])
        
        del self.track_data[track_id]
        return image_filename, video_filename

    def save_image_evidence(self, camera_id, track_id, frame, bbox, violation_type="VIOLATION"):
        date_str = time.strftime("%Y-%m-%d")
        dir_path = os.path.join(self.base_path, camera_id, date_str)
        os.makedirs(dir_path, exist_ok=True)
        
        timestamp = int(time.time())
        filename = f"violation_{track_id}_{timestamp}.jpg"
        filepath = os.path.join(dir_path, filename)
        
        x1, y1, x2, y2 = map(int, bbox)
        annotated = frame.copy()
        cv2.rectangle(annotated, (x1, y1), (x2, y2), (0, 0, 255), 3)
        cv2.putText(annotated, f"VIOLATION: {violation_type}", (x1, max(y1-10, 0)), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0,0,255), 2)
        
        cv2.imwrite(filepath, annotated)
        return filename

    def save_video_clip(self, camera_id, track_id, frames, bboxes, violation_type="VIOLATION"):
        if not frames: return None
        date_str = time.strftime("%Y-%m-%d")
        dir_path = os.path.join(self.base_path, camera_id, date_str)
        os.makedirs(dir_path, exist_ok=True)
        
        timestamp = int(time.time())
        filename = f"clip_{track_id}_{timestamp}.mp4"
        filepath = os.path.join(dir_path, filename)
        
        H, W = frames[0].shape[:2]
        fourcc = cv2.VideoWriter_fourcc(*'mp4v')
        # Typical 15 fps for AI video playback
        out = cv2.VideoWriter(filepath, fourcc, 15.0, (W, H))
        
        for frame, bbox in zip(frames, bboxes):
            annotated = frame.copy()
            x1, y1, x2, y2 = map(int, bbox)
            cv2.rectangle(annotated, (x1, y1), (x2, y2), (0, 0, 255), 2)
            out.write(annotated)
            
        out.release()
        return filename

    def save_plate_crop(self, camera_id, track_id, crop):
        if crop is None or crop.size == 0:
            return None
        date_str = time.strftime("%Y-%m-%d")
        dir_path = os.path.join(self.base_path, camera_id, date_str)
        os.makedirs(dir_path, exist_ok=True)
        
        timestamp = int(time.time())
        filename = f"plate_{track_id}_{timestamp}.jpg"
        filepath = os.path.join(dir_path, filename)
        
        cv2.imwrite(filepath, crop)
        return filename
