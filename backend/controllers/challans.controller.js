const Challan = require('../models/postgres/Challan');
const Violation = require('../models/postgres/Violation');
const { generateChallanPDF } = require('../services/challan.pdf.service');

exports.generate = async (req, res) => {
    try {
        const violation = await Violation.findByPk(req.params.violation_id);
        if (!violation) return res.status(404).json({ error: 'Violation not found' });
        if (violation.status !== 'VERIFIED') return res.status(400).json({ error: 'Violation must be verified first' });

        let challan = await Challan.create({
            violation_id: violation.id,
            officer_id: req.officer.id,
            vehicle_number: violation.plate_number,
            violation_type: violation.violation_type,
            violation_description: violation.violation_description || 'Automated detection',
            evidence_thumbnail_path: violation.plate_image_path || violation.evidence_path,
            timestamp: violation.created_at,
            location_name: violation.location_name,
            camera_id: violation.camera_id
        });

        // Generate PDF
        const pdfFileName = await generateChallanPDF(challan, violation);
        challan.pdf_path = pdfFileName;
        await challan.save();

        res.status(201).json(challan);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getAll = async (req, res) => {
    try {
        const challans = await Challan.findAll({ order: [['generated_at', 'DESC']] });
        res.json(challans);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getById = async (req, res) => {
    try {
        const challan = await Challan.findByPk(req.params.id);
        res.json(challan);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
