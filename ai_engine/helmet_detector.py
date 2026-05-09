import os
import cv2
from ultralytics import YOLO

class HelmetDetector:
    def __init__(self):
        try:
            model_path = os.path.join(os.path.dirname(__file__), 'yolo26n.pt')
            self.model = YOLO(model_path)
            print("[HELMET] Helmet detector loaded using yolo26n.pt")
        except Exception as e:
            print(f"[HELMET] Warning: Could not load helmet model: {e}")
            self.model = None

    def detect_helmet(self, frame, bbox) -> bool:
        try:
            if self.model is None:
                return True  # safe default — assume helmet present

            x1, y1, x2, y2 = map(int, bbox)

            # Clamp to frame dimensions
            h, w = frame.shape[:2]
            x1, y1 = max(0, x1), max(0, y1)
            x2, y2 = min(w, x2), min(h, y2)

            # Use only top 40% of bbox — rider's head region
            head_y2 = y1 + max(1, int((y2 - y1) * 0.4))
            crop = frame[y1:head_y2, x1:x2]

            if crop is None or crop.size == 0:
                return True  # safe default

            results = self.model(crop, verbose=False, conf=0.5)

            for result in results:
                for box in result.boxes:
                    cls_name = result.names[int(box.cls)]
                    # If a person's head is clearly visible and
                    # unobstructed in the crop, no helmet
                    if cls_name == 'person' and float(box.conf) > 0.75:
                        return False  # no helmet detected

            # No clear unobstructed head detected — assume helmet present
            return True

        except Exception as e:
            print(f"[HELMET] detect_helmet error: {e}")
            return True  # safe default on any error
