const express = require('express');
const reportController = require('../controllers/report.controller');
const { verifyToken, requireRole } = require('../middleware/auth.middleware');

const router = express.Router();

// Apply auth protection globally
router.use(verifyToken);
router.use(requireRole('Admin', 'Asset Manager', 'Department Head'));

router.get('/asset-utilization', reportController.getAssetUtilization);
router.get('/maintenance-frequency', reportController.getMaintenanceFrequency);
router.get('/maintenance-due', reportController.getMaintenanceDue);
router.get('/department-allocation-summary', reportController.getDepartmentAllocationSummary);
router.get('/booking-heatmap', reportController.getBookingHeatmap);
router.get('/dashboard-summary', reportController.getDashboardSummary);

module.exports = router;
