import cv2
import os
import time

class EvidenceHandler:
    def __init__(self, base_path="../evidence"):
        self.base_path = base_path
        os.makedirs(base_path, exist_ok=True)
        
    def save_image_evidence(self, camera_id, track_id, frame, bbox):
        date_str = time.strftime("%Y-%m-%d")
        dir_path = os.path.join(self.base_path, camera_id, date_str)
        os.makedirs(dir_path, exist_ok=True)
        
        timestamp = int(time.time())
        filename = f"violation_{track_id}_{timestamp}.jpg"
        filepath = os.path.join(dir_path, filename)
        
        # Draw red box exactly on the violator
        x1, y1, x2, y2 = map(int, bbox)
        annotated = frame.copy()
        cv2.rectangle(annotated, (x1, y1), (x2, y2), (0, 0, 255), 3)
        cv2.putText(annotated, "VIOLATION", (x1, max(y1-10, 0)), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0,0,255), 2)
        
        cv2.imwrite(filepath, annotated)
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
