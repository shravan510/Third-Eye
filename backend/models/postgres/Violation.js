const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/db.postgres');

const Violation = sequelize.define('Violation', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  camera_id: { type: DataTypes.STRING(50), allowNull: false },
  track_id: { type: DataTypes.STRING(50), allowNull: false },
  violation_type: { type: DataTypes.STRING(50), allowNull: false },
  violation_description: { type: DataTypes.TEXT },
  plate_number: { type: DataTypes.STRING(20) },
  plate_confidence: { type: DataTypes.DECIMAL(4,2) },
  speed_kmh: { type: DataTypes.DECIMAL(6,2) },
  speed_limit_kmh: { type: DataTypes.DECIMAL(6,2) },
  location_name: { type: DataTypes.STRING(200) },
  gps_lat: { type: DataTypes.DECIMAL(10,7) },
  gps_lng: { type: DataTypes.DECIMAL(10,7) },
  evidence_type: { type: DataTypes.STRING(10) },
  evidence_path: { type: DataTypes.TEXT },
  plate_image_path: { type: DataTypes.TEXT },
  hmac_signature: { type: DataTypes.STRING(64) },
  status: { type: DataTypes.STRING(20), defaultValue: 'PENDING' },
  officer_id: { type: DataTypes.STRING(50) },
  verified_at: { type: DataTypes.DATE },
}, {
  tableName: 'violations',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});

module.exports = Violation;
