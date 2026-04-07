# 🔑 First Run Initialization & Environment Setup

Welcome to the **Third Eye Traffic System**. Before you can spin up the application for the very first time, you need to initialize your environment variables, configuration files, and API keys across the microservices.

Follow this checklist from top to bottom before running the servers.

---

## 1. Database Initialization (PostgreSQL & MongoDB)

Before configuring your application, the databases must be up and running.

### Setting up PostgreSQL
1. **Install and Run:** Ensure PostgreSQL 15+ is installed and the service is running. (On Windows, you can use pgAdmin or services.msc; on Linux `sudo service postgresql start`).
2. **Create Database:** Create a new database named `third_eye_traffic` using pgAdmin or the SQL Shell (`psql`):
   ```sql
   CREATE DATABASE third_eye_traffic;
   ```
3. **Apply Schema:** Connect to the `third_eye_traffic` database and apply the table definitions.
   * If using `psql`, run:
     ```bash
     psql -U postgres -d third_eye_traffic -f schema.sql
     ```
   * Alternatively, copy the contents of `schema.sql` (found in the project root) and execute them in your pgAdmin query tool.

### Setting up MongoDB
1. **Install and Run:** Ensure MongoDB 7+ is installed and running (`mongod` service).
2. **Default Connection:** MongoDB does not require you to manually create collections in advance. As long as it is running on `mongodb://localhost:27017`, the Node.js backend will automatically create the `third_eye_users` database and collections upon the first connection.

*(Optional: If you are using Docker, you can simply run `docker-compose up -d postgres mongodb` from the root directory to spin both up locally without installing them directly on your host machine).*

---

## 2. Generating Secure JWT & HMAC Keys

The backend uses JSON Web Tokens (JWT) for officer authentication and HMAC-SHA256 signatures to guarantee evidence integrity (tamper-proofing). For production or even typical testing, you need strong random strings for these.

**How to generate secure keys:**
1. Open your terminal or command prompt.
2. Run the following Node.js command to generate a random 64-character hex string:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
3. Run that command **twice**—once to get a string for your `JWT_SECRET`, and a second time to get a string for your `HMAC_SECRET`. Keep these handy for the next step.

---

## 3. Backend Environment Setup (`Node.js`)

The Node.js backend handles the database connections and security.

1. Navigate to the `backend/` folder.
2. You will see a file named `.env.example`.
3. Rename or copy this file to `.env`:
   ```bash
   cd backend
   cp .env.example .env
   ```
4. Open `.env` in your code editor and configure the following required variables:

```ini
PORT=3000
PYTHON_API_URL=http://localhost:8000

# PostgreSQL Setup
PG_HOST=localhost
PG_PORT=5432
PG_DB=third_eye_traffic
PG_USER=postgres
PG_PASSWORD="admin"  # ⚠️ CHANGE THIS to your Postgres password

# MongoDB Setup
MONGO_URI=mongodb://localhost:27017/third_eye_users

# Security & Encryption Keys
# ⚠️ Paste the keys you generated in Step 2 here:
JWT_SECRET=paste_your_first_random_string_here
JWT_EXPIRES_IN=24h
HMAC_SECRET=paste_your_second_random_string_here

# Evidence Storage
EVIDENCE_BASE_PATH=../evidence

# System Speed Limits
DEFAULT_URBAN_SPEED_LIMIT=40
DEFAULT_HIGHWAY_SPEED_LIMIT=60
```

---

## 4. AI Engine Configuration (`Python`)

The Python AI inference engine relies on a YAML configuration file to know which camera to connect to and what hardware to utilize.

1. Navigate to `ai_engine/config.yaml`.
2. Open it in your editor. No renaming is necessary here.
3. Configure your camera ID, Location, and Video Source:

```yaml
cameras:
  - id: "CAM_001"
    name: "Sangli Main Road Demo"
    speed_limit_kmh: 40             # Adjust the limit for this specific camera
    traffic_direction: "north"
    location_name: "Sangli, Maharashtra"
    gps_lat: 16.8524
    gps_lng: 74.5815

    # ⚠️ UNCOMMENT ONLY ONE SOURCE BELOW:
    
    # Option 1: Local Video File (For College Demo)
    source_type: "file"
    source_path: "../demo_videos/sangli_traffic.mp4"

    # Option 2: IP Webcam App (Android Phone)
    # source_type: "ip_webcam"
    # source_path: "http://192.168.1.5:8080/video"
```

---

## 5. Machine Learning Model Checkpoints

The Python server requires the pre-trained weights to perform AI inference.

1. You must download the **YOLO26-Nano** model weights.
2. Obtain `yolo26n.pt` from the Ultralytics release page or your custom training output.
3. Place `yolo26n.pt` directly inside the `ai_engine/` folder.
   * *If you trained your own model using the `training/` scripts, copy `runs/train/weights/best.pt` and rename it to `yolo26n.pt` here.*

---

## 6. Frontend Configuration (`React`)

By default, the Vite React dashboard requires no `.env` file for local development. It is pre-configured to communicate with the Node.js backend on `http://localhost:3000` and the Python MJPEG stream on `http://localhost:8000`.

*However, if you ever change the backend or Python server ports, you must update the URLs in `frontend/src/pages/Dashboard.jsx`.*

---

## 7. Booting Up for the First Time

Once all configurations and databases are populated, execute these steps:

**1. Seed the Admin User:**
```bash
cd backend
node scripts/seed.js
```
*This will create the default admin account: `admin@thirdeye.com` / `Admin@123`.*

**2. Launch Python Engine:**
```bash
cd ai_engine
# (Activate virtual environment if you have one)
python main.py
```

**3. Launch Node Server:**
```bash
cd backend
npm run dev
```

**4. Launch React Dashboard:**
```bash
cd frontend
npm run dev
```

Navigate to `http://localhost:5173` in your browser and log in!
