import math
import time
import numpy as np
import cv2

class SpeedEstimator:
    def __init__(self, homography_config=None):
        self.track_history = {} # track_id -> [(time, x, y)]
        self.H = None
        
        if homography_config and 'pts_src' in homography_config:
            pts_src = np.array(homography_config['pts_src'], dtype=np.float32)
            # Default to India standard 7 meters width
            width = homography_config.get('real_world_width_meters', 7.0)
            length = homography_config.get('real_world_length_meters', 15.0)
            
            pts_dst = np.array([
                [0, length], 
                [width, length], 
                [0, 0], 
                [width, 0]
            ], dtype=np.float32)
            
            self.H, _ = cv2.findHomography(pts_src, pts_dst)

    def estimate(self, track_id, center_x, center_y, frame_time=None):
        current_time = frame_time if frame_time is not None else time.time()
        
        if track_id not in self.track_history:
            self.track_history[track_id] = []

        history = self.track_history[track_id]
        history.append((current_time, center_x, center_y))
        
        if len(history) > 30:
            history.pop(0)

        # wait for some frames before claiming speed
        if len(history) < 10:
            return 0.0

        t1, x1, y1 = history[0]
        t2, x2, y2 = history[-1]
        
        time_delta = t2 - t1
        if time_delta <= 0:
            return 0.0

        if self.H is not None:
            pt1 = np.array([[[x1, y1]]], dtype=np.float32)
            pt2 = np.array([[[x2, y2]]], dtype=np.float32)
            
            trans1 = cv2.perspectiveTransform(pt1, self.H)[0][0]
            trans2 = cv2.perspectiveTransform(pt2, self.H)[0][0]
            
            dist_meters = math.sqrt((trans2[0] - trans1[0])**2 + (trans2[1] - trans1[1])**2)
        else:
            # Hard fallback
            dist_pixels = math.sqrt((x2 - x1)**2 + (y2 - y1)**2)
            dist_meters = dist_pixels * 0.02
        
        speed_mps = dist_meters / time_delta
        speed_kmh = speed_mps * 3.6
        return speed_kmh
