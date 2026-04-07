from ultralytics import YOLO
import sys

# Ensure YOLO package is installed
try:
    model = YOLO("yolo26n.pt")
except Exception as e:
    print(f"Error loading yolo26n.pt: {e}. Please ensure yolo26n.pt is available or correctly downloaded.")
    sys.exit(1)

if __name__ == '__main__':
    # Fine-tune on custom dataset
    model.train(
        data="dataset.yaml",
        epochs=100,
        imgsz=640,
        batch=16,
        lr0=0.001,
        optimizer="SGD",   # Typically standard SGD or AdamW
        augment=True,
        mosaic=1.0,
        mixup=0.1,
        degrees=10.0,            # Rotation augmentation for angled cameras
        flipud=0.0,
        fliplr=0.5,
        hsv_h=0.015,
        hsv_s=0.7,
        hsv_v=0.4,
        project="runs/train",
        name="third_eye_v1",
        patience=20,
        save=True,
        device="0"               # GPU; use "cpu" if no GPU
    )
