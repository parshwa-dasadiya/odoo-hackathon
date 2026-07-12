const express = require('express');
const { body } = require('express-validator');
const transferController = require('../controllers/transfer.controller');
const validate = require('../middleware/validate.middleware');
const { verifyToken, requireRole } = require('../middleware/auth.middleware');

const router = express.Router();

// Apply auth protection globally
router.use(verifyToken);

// GET /api/transfers (Any authenticated user can list)
router.get('/', transferController.getTransfers);

// POST /api/transfers (Any authenticated user can request a transfer)
router.post(
  '/',
  [
    body('assetId')
      .isMongoId()
      .withMessage('assetId must be a valid Mongo ID'),
    body('toHolderType')
      .isIn(['Employee', 'Department'])
      .withMessage('toHolderType must be Employee or Department'),
    body('toHolderId')
      .isMongoId()
      .withMessage('toHolderId must be a valid Mongo ID'),
    body('reason')
      .trim()
      .notEmpty()
      .withMessage('Transfer reason is required')
  ],
  validate,
  transferController.requestTransfer
);

// PATCH /api/transfers/:id/decision (Admin, Asset Manager, Department Head only)
router.patch(
  '/:id/decision',
  requireRole('Admin', 'Asset Manager', 'Department Head'),
  [
    body('decision')
      .isIn(['Approved', 'Rejected'])
      .withMessage('decision must be Approved or Rejected'),
    body('decisionNotes')
      .optional()
      .trim()
  ],
  validate,
  transferController.decideTransfer
);

module.exports = router;
