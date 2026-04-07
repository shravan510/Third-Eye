const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/db.postgres');
const Violation = require('./Violation');

const Challan = sequelize.define('Challan', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  violation_id: { 
      type: DataTypes.UUID,
      references: {
          model: Violation,
          key: 'id'
      }
  },
  officer_id: { type: DataTypes.STRING(50) },
  vehicle_number: { type: DataTypes.STRING(20) },
  violation_type: { type: DataTypes.STRING(50) },
  violation_description: { type: DataTypes.TEXT },
  evidence_thumbnail_path: { type: DataTypes.TEXT },
  timestamp: { type: DataTypes.DATE },
  location_name: { type: DataTypes.STRING(200) },
  camera_id: { type: DataTypes.STRING(50) },
  pdf_path: { type: DataTypes.TEXT },
}, {
  tableName: 'challans',
  timestamps: true,
  createdAt: 'generated_at',
  updatedAt: false
});

module.exports = Challan;
