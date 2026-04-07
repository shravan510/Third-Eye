CREATE TABLE violations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  camera_id VARCHAR(50) NOT NULL,
  track_id VARCHAR(50) NOT NULL,
  violation_type VARCHAR(50) NOT NULL,  -- 'SPEEDING' | 'HELMETLESS' | 'TRIPLE_RIDING' | 'WRONG_SIDE'
  violation_description TEXT,
  plate_number VARCHAR(20),
  plate_confidence DECIMAL(4,2),
  speed_kmh DECIMAL(6,2),
  speed_limit_kmh DECIMAL(6,2),
  location_name VARCHAR(200),
  gps_lat DECIMAL(10,7),
  gps_lng DECIMAL(10,7),
  evidence_type VARCHAR(10),           -- 'video' | 'image'
  evidence_path TEXT,
  plate_image_path TEXT,
  hmac_signature VARCHAR(64),          -- HMAC-SHA256 for tamper detection
  status VARCHAR(20) DEFAULT 'PENDING', -- 'PENDING' | 'VERIFIED' | 'REJECTED'
  officer_id VARCHAR(50),
  verified_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE cameras (
  id VARCHAR(50) PRIMARY KEY,
  location_name VARCHAR(200),
  gps_lat DECIMAL(10,7),
  gps_lng DECIMAL(10,7),
  speed_limit_kmh DECIMAL(6,2) DEFAULT 40,
  traffic_direction VARCHAR(10),       -- 'north' | 'south' | 'east' | 'west'
  is_active BOOLEAN DEFAULT TRUE,
  rtsp_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE challans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  violation_id UUID REFERENCES violations(id),
  officer_id VARCHAR(50),
  vehicle_number VARCHAR(20),
  violation_type VARCHAR(50),
  violation_description TEXT,
  evidence_thumbnail_path TEXT,
  timestamp TIMESTAMP,
  location_name VARCHAR(200),
  camera_id VARCHAR(50),
  pdf_path TEXT,
  generated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE violation_status_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  violation_id UUID REFERENCES violations(id),
  old_status VARCHAR(20),
  new_status VARCHAR(20),
  changed_by_officer_id VARCHAR(50),
  reason TEXT,                        -- optional note officer can add
  changed_at TIMESTAMP DEFAULT NOW()
);
