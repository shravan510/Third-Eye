const Officer = require('../models/mongo/Officer');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const officer = await Officer.findOne({ email });
        if (!officer) return res.status(400).json({ error: 'Invalid credentials' });

        const isMatch = await bcrypt.compare(password, officer.password_hash);
        if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });

        const token = jwt.sign(
            { id: officer.officer_id, role: officer.role, name: officer.name },
            process.env.JWT_SECRET || 'your_jwt_secret_key_here',
            { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
        );

        officer.last_login = new Date();
        await officer.save();

        res.json({ token, officer: { id: officer.officer_id, name: officer.name, role: officer.role } });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getMe = async (req, res) => {
    try {
        const officer = await Officer.findOne({ officer_id: req.officer.id }).select('-password_hash');
        res.json(officer);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
