# 💻 Hardware Support Guide

This project seamlessly works automatically on mixed hardware components avoiding explicit configuration code modifications.

| Laptop Device | GPU / Inference Target | Expected FPS Output | Frame Skip Rate |
| :--- | :--- | :--- | :--- |
| **HP Victus** | RTX 2050 (4GB VRAM) running CUDA | 25-30 FPS | None (1) |
| **ASUS VivoBook** | CPU (Intel Iris Xe) | 8-12 FPS | 3 |

**Confirmation:** 
When booting `ai_engine`, `main.py` explicitly outputs `[HW] Device set to: cuda:0` (if fully accelerated) or `cpu`.

## Manual Overrides

To explicitly force CPU processing alongside active CUDA builds set environment flags: `FORCE_DEVICE=cpu`.

## OpenVINO Acceleration

ASUS running CPUs significantly boost framerates converting `.pt` PyTorch graphs directly into OpenVINO compiled architectures.

```bash
cd ai_engine
python -c "from ultralytics import YOLO; YOLO('yolo26n.pt').export(format='openvino')"
```

The system inherently searches out any folder nested appropriately `/ai_engine/yolo26n_openvino_model/` and defers execution to it instantly if discovered on Intel machines!
