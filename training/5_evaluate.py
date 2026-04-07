from ultralytics import YOLO

if __name__ == "__main__":
    # Load the trained model
    model = YOLO("runs/train/third_eye_v1/weights/best.pt")
    
    # Evaluate performance on validation set
    metrics = model.val(data="dataset.yaml")
    
    print("\nEvaluation Results:")
    print("mAP50-95:", metrics.box.map)
    print("mAP50:", metrics.box.map50)
    print("mAP75:", metrics.box.map75)
    print("Precision:", metrics.box.mean_results()[0])
    print("Recall:", metrics.box.mean_results()[1])
