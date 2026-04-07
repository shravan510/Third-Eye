import numpy as np

class AutoCalibrator:
    def __init__(self):
        # average real-world lengths in meters
        self.reference_lengths = {
            'motorcycle': 2.1,
            'car': 4.2,
            'truck': 7.5,
            'bus': 10.0
        }
        self.pixels_per_meter = 1.0 # default fallback
        self.measurements = []

    def update(self, bounding_box_height, vehicle_class):
        if vehicle_class in self.reference_lengths:
            ppm = bounding_box_height / self.reference_lengths[vehicle_class]
            self.measurements.append(ppm)
            if len(self.measurements) > 100:
                self.measurements.pop(0)
            self.pixels_per_meter = np.mean(self.measurements)
            
    def get_homography_matrix(self):
        # Very simplified pseudo-homography mapping Y displacement
        return np.array([
             [1.0 / self.pixels_per_meter, 0, 0],
             [0, 1.0 / self.pixels_per_meter, 0],
             [0, 0, 1]
        ])
