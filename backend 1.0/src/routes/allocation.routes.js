const express = require('express');
const { body } = require('express-validator');
const allocationController = require('../controllers/allocation.controller');
const validate = require('../middleware/validate.middleware');
const { verifyToken, requireRole } = require('../middleware/auth.middleware');

const router = express.Router();

// Apply auth protection globally to all allocation routes
router.use(verifyToken);

// GET /api/allocations/overdue (Access for Admin, Asset Manager, Department Head)
router.get('/overdue', requireRole('Admin', 'Asset Manager', 'Department Head'), allocationController.getOverdueAllocations);

// GET /api/allocations
router.get('/', allocationController.getAllocations);

// POST /api/allocations (Admin, Asset Manager, Department Head write access)
router.post(
  '/',
  requireRole('Admin', 'Asset Manager', 'Department Head'),
  [
    body('assetId')
      .isMongoId()
      .withMessage('assetId must be a valid Mongo ID'),
    body('holderType')
      .isIn(['Employee', 'Department'])
      .withMessage('holderType must be Employee or Department'),
    body('holderId')
      .isMongoId()
      .withMessage('holderId must be a valid Mongo ID'),
    body('expectedReturnDate')
      .optional({ nullable: true })
      .isISO8601()
      .withMessage('expectedReturnDate must be a valid Date')
      .custom((value) => {
        if (new Date(value) < new Date()) {
          throw new Error('expectedReturnDate cannot be in the past');
        }
        return true;
      })
  ],
  validate,
  allocationController.allocateAsset
);

// POST /api/allocations/:id/return (Admin, Asset Manager, Department Head return action)
router.post(
  '/:id/return',
  requireRole('Admin', 'Asset Manager', 'Department Head'),
  [
    body('returnConditionNotes')
      .optional()
      .trim(),
    body('returnConditionRating')
      .optional({ nullable: true })
      .isIn(['New', 'Good', 'Fair', 'Poor', 'Damaged', null])
      .withMessage('Condition rating must be one of: New, Good, Fair, Poor, Damaged')
  ],
  validate,
  allocationController.returnAsset
);

module.exports = router;
