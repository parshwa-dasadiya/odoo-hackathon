const express = require('express');
const activityLogController = require('../controllers/activityLog.controller');
const { verifyToken, requireRole } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(verifyToken);
router.use(requireRole('Admin', 'Asset Manager'));

router.get('/', activityLogController.getActivityLogs);

module.exports = router;
