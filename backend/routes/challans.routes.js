const express = require('express');
const router = express.Router();
const challansController = require('../controllers/challans.controller');
const authMiddleware = require('../middleware/auth.middleware');

router.post('/generate/:violation_id', authMiddleware, challansController.generate);
router.get('/', authMiddleware, challansController.getAll);
router.get('/:id', authMiddleware, challansController.getById);

module.exports = router;
