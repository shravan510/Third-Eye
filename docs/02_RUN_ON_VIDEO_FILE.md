# 🎬 Run on Video File (College Demo Mode)

Use this mode for reliable demonstrations, testing against pre-recorded traffic flow.

## 1. Prepare your Video

Place your video file in the `/demo_videos/` folder. Format must be MP4, AVI, MOV, or MKV.

**Where to get videos?**
*   Download YouTube Creative Commons (e.g., using `yt-dlp`).
*   Roboflow Universe Data Sets.
*   IIT Bombay / IIT Madras Traffic databases.

## 2. Setting Configuration

Open `/ai_engine/config.yaml`. Set it manually:

```yaml
cameras:
  - id: "CAM_001"
    name: "Sangli Main Road Demo"
    source_type: "file" 
    source_path: "../demo_videos/sangli_traffic.mp4"
inference:
  loop_video: true
  realtime_playback: true
```

## 3. Launching

Start the DBs (Mongo + PostgreSQL).

**A. Start Python AI Engine**
```bash
cd ai_engine
python main.py
```
Wait for `[HW] Device set to:` output confirming model payload loads securely.

**B. Start Backend**
```bash
cd backend
npm run dev
```

**C. Start Frontend**
```bash
cd frontend
npm run dev
```

Visit `http://localhost:5173`. Login with Administrator Defaults!
