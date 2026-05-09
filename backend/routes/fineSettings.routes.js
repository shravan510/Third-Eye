const express = require('express');
const router = express.Router();
const fineSettingsController = require('../controllers/fineSettings.controller');
const authMiddleware = require('../middleware/auth.middleware');

router.get('/', fineSettingsController.getAll);
router.post('/', authMiddleware, fineSettingsController.create);
router.put('/:type', authMiddleware, fineSettingsController.update);

module.exports = router;
