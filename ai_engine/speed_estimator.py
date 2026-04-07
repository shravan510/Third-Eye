import math
import time

class SpeedEstimator:
    def __init__(self):
        self.track_history = {} # track_id -> [(time, x, y)]

    def estimate(self, track_id, center_x, center_y, homography_matrix):
        current_time = time.time()
        
        if track_id not in self.track_history:
            self.track_history[track_id] = []

        history = self.track_history[track_id]
        history.append((current_time, center_x, center_y))
        
        if len(history) > 10:
            history.pop(0)

        if len(history) < 3:
            return 0.0

        # Delta between oldest and newest in history
        t1, x1, y1 = history[0]
        t2, x2, y2 = history[-1]
        
        time_delta = t2 - t1
        if time_delta == 0:
            return 0.0

        # transform to real world using ppm from homography
        ppm = 1.0 / homography_matrix[0][0]
        
        dist_pixels = math.sqrt((x2 - x1)**2 + (y2 - y1)**2)
        dist_meters = dist_pixels / ppm
        
        speed_mps = dist_meters / time_delta
        speed_kmh = speed_mps * 3.6
        return speed_kmh
