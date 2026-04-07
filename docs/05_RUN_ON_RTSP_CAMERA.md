# 📡 RTSP Production Setup

An RTSP stream delivers IP-based live feeds. Typically, permanent CCTV camera systems distribute `.rtsp` streams.

## 1. Acquiring The Stream Header

Locate the exact IP for your primary camera hardware from its admin manual or local subnet router index. Identify the credential login prefix if it exists.

Example formats:
`rtsp://192.168.1.100:554/stream`
`rtsp://admin:password@192.168.1.100:554/h264/ch1/main/av_stream`

**Crucial Constraints**: The machine running `backend` and `ai_engine` must exist on the specific same Virtual Private Network (VPN) or same underlying internal local network as the camera interface itself.

## 2. Setting Configuration

Modify `/ai_engine/config.yaml`.

```yaml
cameras:
  - id: "CAM_EXTERNAL_001"
    name: "Intersection Central Node"
    source_type: "rtsp"
    source_path: "rtsp://your-camera-ip:554/stream"
```

## Adding More Cameras

Replicate the block identically, appending new IDs (`CAM_EXTERNAL_002`) and configuring specific sources, traffic directions, and distinct speed limits. Start the project cleanly after edits.
