const express = require('express');
const router = express.Router();
const violationsController = require('../controllers/violations.controller');
const authMiddleware = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');

router.post('/ingest', upload.fields([{ name: 'evidence', maxCount: 1 }, { name: 'plate', maxCount: 1 }]), violationsController.ingestViolation);

router.get('/', authMiddleware, violationsController.getAll);
router.get('/:id', authMiddleware, violationsController.getById);
router.patch('/:id/verify', authMiddleware, violationsController.verify);
router.patch('/:id/reject', authMiddleware, violationsController.reject);

module.exports = router;
