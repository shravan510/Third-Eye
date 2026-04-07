const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/db.postgres');

const Camera = sequelize.define('Camera', {
  id: {
    type: DataTypes.STRING(50),
    primaryKey: true,
  },
  location_name: { type: DataTypes.STRING(200) },
  gps_lat: { type: DataTypes.DECIMAL(10,7) },
  gps_lng: { type: DataTypes.DECIMAL(10,7) },
  speed_limit_kmh: { type: DataTypes.DECIMAL(6,2), defaultValue: 40 },
  traffic_direction: { type: DataTypes.STRING(10) },
  is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
  rtsp_url: { type: DataTypes.TEXT },
}, {
  tableName: 'cameras',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});

module.exports = Camera;
