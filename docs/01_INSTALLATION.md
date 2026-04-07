# 🛠 Installation Guide

Follow these steps faithfully to get the entire project setup locally without Docker.

## Prerequisites

1.  Python 3.10+
2.  Node.js 18+
3.  PostgreSQL 15 (Running locally or via Docker mapping)
4.  MongoDB 7+
5.  Git

## Step-by-Step Installation

```bash
# Step 1: Clone the repository
git clone <your-repo-url>
cd third-eye-traffic

# Step 2: Set up Python Virtual Environment
cd ai_engine
python -m venv venv
venv\Scripts\activate   # (Windows)
# source venv/bin/activate # (Mac/Linux)

# Step 3: Install AI Dependencies
pip install -r requirements.txt

# Step 4: Install PaddleOCR
pip install paddlepaddle==2026.1.29 paddleocr==3.4.0

# Step 5: Install Node Dependencies - Backend
cd ../backend
npm install

# Step 6: Install Node Dependencies - Frontend
cd ../frontend
npm install

# Step 7: Setup Databases
# Make sure postgres and mongodb are running on default ports
# Run the supplied schema.sql over your Postgres database 'third_eye_traffic'

# Step 8: Setup .env
# Copy backend/.env.example to backend/.env and populate your SQL password

# Step 9: Seed the User DB
cd backend
node scripts/seed.js
```

## Hardware Setup Requirements

*   **HP Victus (RTX 2050)**: Install CUDA toolkit, verify with `nvidia-smi`. `ai_engine` detects CUDA seamlessly automatically.
*   **ASUS VivoBook (Iris Xe)**: No CUDA needed automatically falls back to CPU. Consider exporting to model format "openvino" for acceleration.
