from ultralytics import YOLO


class HelmetDetector:
    def __init__(self):
        self.model = YOLO('keremberke/yolov8n-helmet-detection')

    def detect_helmet(self, frame, bbox) -> bool:
        """
        Detect whether a helmet is visible in the top 40% of the given bounding box.

        Args:
            frame: Full BGR frame from OpenCV.
            bbox:  (x1, y1, x2, y2) bounding box of the vehicle/rider.

        Returns:
            True if a helmet is detected, False otherwise.
        """
        try:
            x1, y1, x2, y2 = map(int, bbox)

            # Clamp to frame dimensions
            h, w = frame.shape[:2]
            x1, y1 = max(0, x1), max(0, y1)
            x2, y2 = min(w, x2), min(h, y2)

            # Use only the top 40 % of the bbox height (rider's head area)
            head_y2 = y1 + max(1, int((y2 - y1) * 0.4))
            crop = frame[y1:head_y2, x1:x2]

            if crop.size == 0:
                return False

            results = self.model(crop, verbose=False, conf=0.5)

            for result in results:
                if result.boxes is None:
                    continue
                for box in result.boxes:
                    cls_id = int(box.cls[0])
                    class_name = result.names.get(cls_id, '').lower()
                    if class_name == 'helmet':
                        return True

            return False

        except Exception:
            return False
