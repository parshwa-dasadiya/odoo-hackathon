const express = require('express');
const reportController = require('../controllers/report.controller');
const { verifyToken } = require('../middleware/auth.middleware');

const router = express.Router();

// Apply auth protection globally
router.use(verifyToken);

router.get('/summary', reportController.getDashboardSummary);

module.exports = router;
