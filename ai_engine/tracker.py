class ByteTrackerWrapper:
    def extract_tracks(self, yolo_result):
        tracks = []
        if yolo_result is None or yolo_result.boxes is None or yolo_result.boxes.id is None:
            return tracks
            
        boxes = yolo_result.boxes.xyxy.cpu().numpy()
        track_ids = yolo_result.boxes.id.int().cpu().numpy()
        classes = yolo_result.boxes.cls.int().cpu().numpy()
        confs = yolo_result.boxes.conf.cpu().numpy()
        
        for box, t_id, cls_id, conf in zip(boxes, track_ids, classes, confs):
            tracks.append({
                'track_id': str(t_id),
                'bbox': box,
                'class_id': cls_id,
                'class_name': yolo_result.names[cls_id],
                'conf': float(conf)
            })
        return tracks
