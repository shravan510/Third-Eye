# 🖥️ Laptop Webcam Guide

When simply testing if the app handles input accurately without loading traffic files or IP configs hook the camera immediately onto your own face (although traffic detections aren't guaranteed to test true on a human face).

## 1. Modifying Configuration

Edit `/ai_engine/config.yaml` precisely:

```yaml
source_type: "webcam"
source_path: 0 
```

`0` indicates internal webcam. Overwrite with `1` to select an external USB webcam if one attaches presently to your machine!

## 2. Booting

Start all typical microservices (Python, Node, Vite) identical step counts from standard installation guidelines. Ensure the room provides heavy lighting, and show an isolated car toy or photo screen facing to verify functionality.
