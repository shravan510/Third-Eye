class ByteTrackerWrapper:
    def __init__(self, max_age=30):
        self.last_known_tracks = {} # track_id -> track_dict
        self.max_age = max_age

    def extract_tracks(self, yolo_result):
        current_tracks = {}
        
        if yolo_result is not None and yolo_result.boxes is not None and yolo_result.boxes.id is not None:
            boxes = yolo_result.boxes.xyxy.cpu().numpy()
            track_ids = yolo_result.boxes.id.int().cpu().numpy()
            classes = yolo_result.boxes.cls.int().cpu().numpy()
            confs = yolo_result.boxes.conf.cpu().numpy()
            
            for box, t_id, cls_id, conf in zip(boxes, track_ids, classes, confs):
                track_id = str(t_id)
                current_tracks[track_id] = {
                    'track_id': track_id,
                    'bbox': box,
                    'class_id': cls_id,
                    'class_name': yolo_result.names[cls_id],
                    'conf': float(conf),
                    'lost': False,
                    'age': 0
                }
                
        # Merge with last known for persistent tracking
        for t_id, t_data in self.last_known_tracks.items():
            if t_id not in current_tracks:
                t_data['lost'] = True
                t_data['age'] += 1
                if t_data['age'] < self.max_age:
                    current_tracks[t_id] = t_data
                    
        self.last_known_tracks = current_tracks
        return list(current_tracks.values())
