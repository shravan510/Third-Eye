class ViolationClassifier:
    def __init__(self, fps_buffer=3):
        self.buffer_limit = fps_buffer
        self.violation_counts = {} # track_id -> dict of violations mapped to counts
        self.reported = set()

    def check_violations(self, track_id, vehicle_class, speed_kmh, speed_limit, persons_on_bike, helmet_detected):
        if track_id not in self.violation_counts:
            self.violation_counts[track_id] = {
                'SPEEDING': 0, 'HELMETLESS': 0, 'TRIPLE_RIDING': 0
            }
            
        counts = self.violation_counts[track_id]
        new_violations = []

        if speed_kmh > speed_limit:
            counts['SPEEDING'] += 1
        else:
            counts['SPEEDING'] = max(0, counts['SPEEDING'] - 1)

        if vehicle_class == 'motorcycle':
            if persons_on_bike > 0 and not helmet_detected:
                counts['HELMETLESS'] += 1
            else:
                counts['HELMETLESS'] = max(0, counts['HELMETLESS'] - 1)
                
            if persons_on_bike >= 3:
                counts['TRIPLE_RIDING'] += 1
            else:
                counts['TRIPLE_RIDING'] = max(0, counts['TRIPLE_RIDING'] - 1)

        for v_type, count in counts.items():
            if count >= self.buffer_limit:
                if (track_id, v_type) not in self.reported:
                    new_violations.append(v_type)
                    self.reported.add((track_id, v_type))
                
        return new_violations
