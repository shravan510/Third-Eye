const mongoose = require('mongoose');

const officerSchema = new mongoose.Schema({
  officer_id: { type: String, unique: true, required: true },
  name: { type: String, required: true },
  badge_number: { type: String, unique: true },
  email: { type: String, unique: true },
  password_hash: String,
  role: { type: String, enum: ['officer', 'supervisor', 'admin'], default: 'officer' },
  station: String,
  is_active: { type: Boolean, default: true },
  last_login: Date,
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Officer', officerSchema);
