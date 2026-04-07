import cv2
import re
import numpy as np
try:
    from paddleocr import PaddleOCR
except ImportError:
    PaddleOCR = None

class OCREngine:
    def __init__(self, use_gpu=False):
        if PaddleOCR is not None:
            self.ocr = PaddleOCR(use_angle_cls=True, lang='en')
        else:
            self.ocr = None

    def read_plate(self, image_crop):
        if self.ocr is None or image_crop is None or image_crop.size == 0:
            return "UNREADABLE", 0.0

        # Enhance contrast (CLAHE)
        gray = cv2.cvtColor(image_crop, cv2.COLOR_BGR2GRAY)
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
        enhanced = clahe.apply(gray)
        enhanced_bgr = cv2.cvtColor(enhanced, cv2.COLOR_GRAY2BGR)

        result = self.ocr.ocr(enhanced_bgr, cls=True)
        if not result or not result[0]:
            return "UNREADABLE", 0.0

        best_text = "UNREADABLE"
        best_conf = 0.0

        for line in result[0]:
            text = line[1][0]
            conf = line[1][1]
            # Strip spaces and special chars
            clean_text = re.sub(r'[^A-Z0-9]', '', text.upper())
            if conf > best_conf and len(clean_text) >= 4:
                best_text = clean_text
                best_conf = conf

        if best_conf < 0.6:
            return "UNREADABLE", best_conf

        return best_text, best_conf
