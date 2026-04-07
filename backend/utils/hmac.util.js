const crypto = require('crypto');

function signViolation(data) {
  const secret = process.env.HMAC_SECRET || 'your_hmac_secret_key_here';
  const payload = `${data.id || data.violation_id}|${data.plate_number}|${data.speed_kmh}|${data.created_at}`;
  return crypto.createHmac('sha256', secret).update(payload).digest('hex');
}

function verifyViolation(data, signature) {
  return signViolation(data) === signature;
}

module.exports = { signViolation, verifyViolation };
