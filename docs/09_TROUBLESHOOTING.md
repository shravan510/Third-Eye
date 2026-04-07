# 🔧 Troubleshooting Handbook

### PROBLEM: "Cannot connect to IP Webcam"
**FIX:** Check phone and laptop on identical WiFi. Try opening `http://192.168.x.x:8080` in local laptop browser. If page loads beautifully, URL is absolutely correct. Check IP values recursively.

### PROBLEM: "yolo26n.pt not found"
**FIX:** Standard model checkpoints aren't hard-included via Git. Search standard Ultralytics releases, download the Nano checkpoint, format carefully out to `yolo26n.pt` within the primary `/ai_engine/` directory itself!

### PROBLEM: "CUDA not available" on HP Victus
**FIX:** Install standard NVIDIA CUDA Development Toolkits. Run `nvidia-smi` natively to ensure GPU works correctly. Install pytorch variants directly targeting CUDA instead of strictly CPU indices.

### PROBLEM: Dashboard shows violations but no live feed
**FIX:** Ensure stream handles point accurately. Connect locally via browser to `http://localhost:8000/api/live-feed/CAM_001`. If it fails, restart the FastAPI ai layer!

### PROBLEM: PostgreSQL connection refused
**FIX:** Guarantee Postgres operates smoothly. Services run completely offline unless started correctly. On Windows Search `Services` and reboot PostgreSQL!

### PROBLEM: Speed consistently reads 0 km/h
**FIX:** Wait patiently. Homography calibrations intelligently bootstrap themselves needing 10 solid detection passes beforehand mathematically calculating matrix dimensions reliably!
