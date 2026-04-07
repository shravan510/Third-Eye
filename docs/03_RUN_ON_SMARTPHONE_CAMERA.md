# 📱 Smartphone IP Camera Guide

Instead of dedicated CCTV hardware, a simple smartphone enables powerful proof-of-concept testing!

## 1. Setup the Smartphone App

1.  **Download on Android:** Go to Google Play Store and install **IP Webcam** by Pavel Khlebovich.
2.  **Configuration:**
    *   Set Video Resolution to exactly `1280x720` (720p).
    *   Set Quality to `60%`.
    *   Turn `Continuous video focus` to ON.
3.  **Start the Stream:** Scroll completely to the bottom of the IP Webcam App home page, and map **Start Server**.

*The app will explicitly spit out a URL linking stream like: http://192.168.1.5:8080*

**CRITICAL:** Both your computer and phone must reside on precisely the same WiFi network! Alternatively, connect your PC to the Phone's Personal Hotspot!

## 2. Link with System Configuration 

Open `/ai_engine/config.yaml` to substitute defaults.

```yaml
source_type: "ip_webcam"
source_path: "http://192.168.1.5:8080/video"
```

Start the platform exactly like defined in Chapter 02.
