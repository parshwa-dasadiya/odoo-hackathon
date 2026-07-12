const express = require('express');
const { body } = require('express-validator');
const auditController = require('../controllers/audit.controller');
const validate = require('../middleware/validate.middleware');
const { verifyToken, requireRole } = require('../middleware/auth.middleware');

const router = express.Router();

// Apply auth protection globally
router.use(verifyToken);

// GET /api/audits
router.get('/', auditController.getAuditCycles);

// GET /api/audits/:id/items
router.get('/:id/items', auditController.getAuditItems);

// GET /api/audits/:id/discrepancy-report
router.get('/:id/discrepancy-report', auditController.getDiscrepancyReport);

// POST /api/audits (Admin/Asset Manager only)
router.post(
  '/',
  requireRole('Admin', 'Asset Manager'),
  [
    body('name')
      .trim()
      .notEmpty()
      .withMessage('Audit cycle name is required'),
    body('scopeDepartment')
      .optional()
      .isMongoId()
      .withMessage('scopeDepartment must be a valid Mongo ID'),
    body('scopeLocation')
      .optional()
      .trim(),
    body('startDate')
      .isISO8601()
      .withMessage('startDate must be a valid ISO8601 date'),
    body('endDate')
      .isISO8601()
      .withMessage('endDate must be a valid ISO8601 date'),
    body('assignedAuditors')
      .isArray({ min: 1 })
      .withMessage('At least one assigned auditor is required'),
    body('assignedAuditors.*')
      .isMongoId()
      .withMessage('Each assigned auditor must be a valid Mongo ID')
  ],
  validate,
  auditController.createAuditCycle
);

// PATCH /api/audits/:id/items/:itemId
router.patch(
  '/:id/items/:itemId',
  [
    body('result')
      .isIn(['Verified', 'Missing', 'Damaged'])
      .withMessage('result must be Verified, Missing, or Damaged'),
    body('notes')
      .optional()
      .trim()
  ],
  validate,
  auditController.updateAuditItem
);

// PATCH /api/audits/:id/close (Admin/Asset Manager only)
router.patch(
  '/:id/close',
  requireRole('Admin', 'Asset Manager'),
  auditController.closeAuditCycle
);

module.exports = router;
