import cv2
import time
import urllib.request
import requests
import numpy as np

class VideoSource:
    def __init__(self, camera_config):
        source_type = camera_config['source_type']
        source_path = camera_config['source_path']
        self.loop = camera_config.get('loop_video', True)
        self.realtime_playback = camera_config.get('realtime_playback', True)
        self.source_type = source_type
        self.source_path = source_path
        self.last_frame_time = None
        self.frame_interval = None  
        self.cap = None

        if source_type == "ip_webcam":
            self.shot_url = source_path.replace("/video", "/shot.jpg")
            if not self.shot_url.endswith("/shot.jpg"):
                if self.shot_url.endswith("/"):
                    self.shot_url += "shot.jpg"
                else:
                    self.shot_url += "/shot.jpg"
            print(f"[SOURCE] Direct Fetching IP Webcam via Native HTTP: {self.shot_url}")
        elif source_type == "file":
            print(f"[SOURCE] Loading video file: {source_path}")
            self.cap = cv2.VideoCapture(source_path)
            if not self.cap.isOpened():
                print(f"[WARNING] Video file not found: {source_path}")
            else:
                native_fps = self.cap.get(cv2.CAP_PROP_FPS) or 25
                if native_fps <= 0: native_fps = 25
                self.frame_interval = 1.0 / native_fps
                print(f"[SOURCE] Video FPS: {native_fps:.1f} — real-time playback enabled")
        elif source_type == "image":
            print(f"[SOURCE] Loading image file: {source_path}")
            self.image_frame = cv2.imread(source_path)
            if self.image_frame is None:
                print(f"[WARNING] Image file not found or invalid: {source_path}")
            self.image_read = False
        elif source_type == "webcam":
            print(f"[SOURCE] Opening webcam index: {source_path}")
            self.cap = cv2.VideoCapture(int(source_path))
            self.cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
            self.cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)
        elif source_type == "rtsp":
            print(f"[SOURCE] Connecting to RTSP stream: {source_path}")
            self.cap = cv2.VideoCapture(source_path, cv2.CAP_FFMPEG)

    def read_frame(self):
        if self.source_type == "image":
            if not self.image_read:
                self.image_read = True
                return True, self.image_frame.copy() if self.image_frame is not None else None
            # Return False continuously so loop knows to stop or we can sleep
            time.sleep(0.1)
            return False, None

        if self.source_type == "ip_webcam":
            try:
                headers = {'User-Agent': 'Mozilla/5.0'}
                resp = requests.get(self.shot_url, timeout=5, headers=headers, proxies={"http": None, "https": None})
                if resp.status_code == 200:
                    arr = np.frombuffer(resp.content, dtype=np.uint8)
                    frame = cv2.imdecode(arr, -1)
                    if frame is None:
                        return False, None
                    return True, frame
                else:
                    return False, None
            except Exception as e:
                return False, None

        if self.source_type == "file" and self.realtime_playback and self.frame_interval:
            now = time.time()
            if self.last_frame_time:
                elapsed = now - self.last_frame_time
                wait = self.frame_interval - elapsed
                if wait > 0:
                    time.sleep(wait)
            self.last_frame_time = time.time()

        if self.cap is None:
            return False, None
            
        ret, frame = self.cap.read()

        if not ret and self.loop and self.source_type == "file":
            self.cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
            self.last_frame_time = None
            ret, frame = self.cap.read()

        return ret, frame

    def get_source_info(self) -> dict:
        if self.source_type == "image":
            return {
                "source_type": "image",
                "width": getattr(self, 'image_frame', None).shape[1] if hasattr(self, 'image_frame') and self.image_frame is not None else 1280,
                "height": getattr(self, 'image_frame', None).shape[0] if hasattr(self, 'image_frame') and self.image_frame is not None else 720,
                "fps": 1,
            }
        return {
            "source_type": self.source_type,
            "width": int(self.cap.get(cv2.CAP_PROP_FRAME_WIDTH)) if self.cap else 1280,
            "height": int(self.cap.get(cv2.CAP_PROP_FRAME_HEIGHT)) if self.cap else 720,
            "fps": self.cap.get(cv2.CAP_PROP_FPS) if self.cap else 30,
        }

    def release(self):
        if hasattr(self, 'cap') and self.cap is not None:
            self.cap.release()
