const express = require('express');
const { body } = require('express-validator');
const maintenanceController = require('../controllers/maintenance.controller');
const validate = require('../middleware/validate.middleware');
const { verifyToken, requireRole } = require('../middleware/auth.middleware');

const router = express.Router();

// Apply auth protection globally
router.use(verifyToken);

// GET /api/maintenance
router.get('/', maintenanceController.getRequests);

// GET /api/maintenance/asset/:assetId
router.get('/asset/:assetId', maintenanceController.getAssetMaintenanceHistory);

// POST /api/maintenance
router.post(
  '/',
  [
    body('assetId')
      .isMongoId()
      .withMessage('assetId must be a valid Mongo ID'),
    body('issueDescription')
      .trim()
      .isLength({ min: 10 })
      .withMessage('Issue description must be at least 10 characters long'),
    body('priority')
      .optional()
      .isIn(['Low', 'Medium', 'High', 'Critical'])
      .withMessage('Priority must be Low, Medium, High, or Critical'),
    body('photo')
      .optional()
      .isURL()
      .withMessage('Photo must be a valid URL')
  ],
  validate,
  maintenanceController.raiseRequest
);

// PATCH /api/maintenance/:id/decision
router.patch(
  '/:id/decision',
  requireRole('Admin', 'Asset Manager'),
  [
    body('decision')
      .isIn(['Approved', 'Rejected'])
      .withMessage('Decision must be Approved or Rejected'),
    body('decisionNotes')
      .optional()
      .trim(),
    body('technicianName')
      .optional()
      .trim(),
    body('technicianContact')
      .optional()
      .trim()
  ],
  validate,
  maintenanceController.decideRequest
);

// PATCH /api/maintenance/:id/start
router.patch(
  '/:id/start',
  requireRole('Admin', 'Asset Manager'),
  maintenanceController.startMaintenance
);

// PATCH /api/maintenance/:id/resolve
router.patch(
  '/:id/resolve',
  requireRole('Admin', 'Asset Manager'),
  [
    body('resolutionNotes')
      .optional()
      .trim()
  ],
  validate,
  maintenanceController.resolveMaintenance
);

module.exports = router;
