from ultralytics import YOLO

if __name__ == "__main__":
    model = YOLO("runs/train/third_eye_v1/weights/best.pt")
    
    # Export to openvino for ASUS laptop performance boosts
    model.export(format="openvino")
    print("Exported to OpenVINO successfully. You can copy the generated folder back to the ai_engine directory.")
