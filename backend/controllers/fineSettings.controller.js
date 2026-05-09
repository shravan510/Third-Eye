const FineSetting = require('../models/postgres/FineSetting');

exports.getAll = async (req, res) => {
    try {
        const settings = await FineSetting.findAll({ order: [['id', 'ASC']] });
        res.json(settings);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.create = async (req, res) => {
    try {
        const { violation_type, amount, section, description } = req.body;

        if (!violation_type || violation_type.trim() === '') {
            return res.status(400).json({ error: 'violation_type is required.' });
        }
        if (amount === undefined || isNaN(Number(amount)) || Number(amount) < 0) {
            return res.status(400).json({ error: 'A valid non-negative amount is required.' });
        }
        if (!section || section.trim() === '') {
            return res.status(400).json({ error: 'section is required.' });
        }
        if (!description || description.trim() === '') {
            return res.status(400).json({ error: 'description is required.' });
        }

        const existing = await FineSetting.findOne({ where: { violation_type: violation_type.toUpperCase() } });
        if (existing) {
            return res.status(409).json({ error: `Fine setting for '${violation_type}' already exists. Use PUT to update.` });
        }

        const row = await FineSetting.create({
            violation_type: violation_type.toUpperCase(),
            amount: Number(amount),
            section: section.trim(),
            description: description.trim(),
            updated_at: new Date(),
        });
        res.status(201).json(row);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.update = async (req, res) => {
    try {
        const { type } = req.params;
        const { amount } = req.body;

        if (amount === undefined || isNaN(Number(amount)) || Number(amount) < 0) {
            return res.status(400).json({ error: 'A valid non-negative amount is required.' });
        }

        const [updated] = await FineSetting.update(
            { amount: Number(amount), updated_at: new Date() },
            { where: { violation_type: type.toUpperCase() }, returning: true }
        );

        if (updated === 0) {
            return res.status(404).json({ error: `No fine setting found for violation type: ${type}` });
        }

        const row = await FineSetting.findOne({ where: { violation_type: type.toUpperCase() } });
        res.json(row);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
