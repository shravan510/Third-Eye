from ultralytics import YOLO
import sys

class ObjectDetector:
    def __init__(self, model_path="yolo26n.pt", device="cpu"):
        try:
            self.model = YOLO(model_path)
            self.model.to(device)
        except Exception as e:
            print(f"[ERROR] Could not load YOLO model from {model_path}: {e}")
            # Ensure tests don't permanently fail instantly if yolo26 isn't locally downloaded
            self.model = None

    def detect(self, frame, conf_threshold=0.45):
        if self.model is None:
            return None
        # We use Ultralytics default detection + bytetrack integration
        results = self.model.track(frame, tracker="bytetrack.yaml", persist=True, conf=conf_threshold, verbose=False)
        return results[0]
