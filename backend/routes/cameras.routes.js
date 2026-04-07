const express = require('express');
const router = express.Router();
const Camera = require('../models/postgres/Camera');
const authMiddleware = require('../middleware/auth.middleware');

router.get('/', authMiddleware, async (req, res) => {
    try {
        const cameras = await Camera.findAll();
        res.json(cameras);
    } catch(err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
