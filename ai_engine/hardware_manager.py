import torch
import platform
import os

def get_optimal_device():
    if torch.cuda.is_available():
        gpu_name = torch.cuda.get_device_name(0)
        vram_gb = torch.cuda.get_device_properties(0).total_memory / 1e9
        print(f"[HW] CUDA GPU detected: {gpu_name} ({vram_gb:.1f} GB VRAM)")
        print(f"[HW] Device set to: cuda:0 — NVIDIA GPU inference enabled")
        return "cuda:0"
    elif hasattr(torch.backends, 'mps') and torch.backends.mps.is_available():
        print("[HW] Apple MPS detected — using MPS inference")
        return "mps"
    else:
        print("[HW] No discrete GPU detected — using CPU inference")
        print("[HW] Tip: For Intel Iris Xe, export model to OpenVINO for faster inference:")
        print("[HW]   model.export(format='openvino'); model = YOLO('yolo26n_openvino_model/')")
        return "cpu"

def get_recommended_frame_skip(device: str) -> int:
    if "cuda" in device or "mps" in device:
        return 1   # GPU: process every frame
    return 3       # CPU: skip frames to stay real-time
