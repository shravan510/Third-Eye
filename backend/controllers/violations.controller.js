const Violation = require('../models/postgres/Violation');
const { signViolation, verifyViolation } = require('../utils/hmac.util');

exports.ingestViolation = async (req, res) => {
    try {
        const { camera_id, track_id, violation_type, speed_kmh, plate_number, location_name } = req.body;
        
        let evidence_path = null;
        let plate_image_path = null;
        
        if (req.files && req.files.evidence) evidence_path = req.files.evidence[0].filename;
        if (req.files && req.files.plate) plate_image_path = req.files.plate[0].filename;

        const payload = {
            camera_id,
            track_id, 
            violation_type,
            speed_kmh, 
            plate_number, 
            location_name,
            evidence_type: req.body.evidence_type || 'image',
            evidence_path,
            plate_image_path
        };

        const signature = signViolation(payload);
        payload.hmac_signature = signature;

        const violation = await Violation.create(payload);

        // Emit socket event
        const io = req.app.get('socketio');
        if (io) {
            io.emit('new_violation', violation);
        }

        res.status(201).json(violation);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};

exports.getAll = async (req, res) => {
    try {
        const violations = await Violation.findAll({ order: [['created_at', 'DESC']] });
        res.json(violations);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getById = async (req, res) => {
    try {
        const violation = await Violation.findByPk(req.params.id);
        if (!violation) return res.status(404).json({ error: 'Not found' });

        const integrity = verifyViolation(violation, violation.hmac_signature) ? 'valid' : 'tampered';
        
        res.json({ violation, integrity });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.verify = async (req, res) => {
    try {
        const violation = await Violation.findByPk(req.params.id);
        if (!violation) return res.status(404).json({ error: 'Not found' });

        violation.status = 'VERIFIED';
        violation.officer_id = req.officer.id;
        violation.verified_at = new Date();
        await violation.save();

        const io = req.app.get('socketio');
        if (io) io.emit('violation_verified', { id: violation.id });

        res.json(violation);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.reject = async (req, res) => {
    try {
        const violation = await Violation.findByPk(req.params.id);
        if (!violation) return res.status(404).json({ error: 'Not found' });

        violation.status = 'REJECTED';
        await violation.save();

        const io = req.app.get('socketio');
        if (io) io.emit('violation_rejected', { id: violation.id });

        res.json(violation);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
