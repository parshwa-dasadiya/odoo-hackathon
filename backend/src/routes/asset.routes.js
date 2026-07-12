const express = require('express');
const { body } = require('express-validator');
const assetController = require('../controllers/asset.controller');
const validate = require('../middleware/validate.middleware');
const { verifyToken, requireRole } = require('../middleware/auth.middleware');

const router = express.Router();

// Apply auth protection globally to all asset routes
router.use(verifyToken);

// GET /api/assets (Any authenticated user can read)
router.get('/', assetController.getAssets);

// GET /api/assets/:id (Any authenticated user can read)
router.get('/:id', assetController.getAssetById);

// GET /api/assets/:id/history (Any authenticated user can read)
router.get('/:id/history', assetController.getAssetHistory);

// POST /api/assets (Admin or Asset Manager write only)
router.post(
  '/',
  requireRole('Admin', 'Asset Manager'),
  [
    body('name')
      .trim()
      .notEmpty()
      .withMessage('Asset name is required'),
    body('category')
      .isMongoId()
      .withMessage('Category must be a valid Mongo ID'),
    body('serialNumber')
      .optional({ nullable: true })
      .trim(),
    body('acquisitionDate')
      .isISO8601()
      .withMessage('Acquisition date must be a valid Date')
      .custom((value) => {
        if (new Date(value) > new Date()) {
          throw new Error('Acquisition date cannot be in the future');
        }
        return true;
      }),
    body('acquisitionCost')
      .isNumeric()
      .withMessage('Acquisition cost must be a number')
      .custom((value) => {
        if (parseFloat(value) < 0) {
          throw new Error('Acquisition cost cannot be negative');
        }
        return true;
      }),
    body('condition')
      .isIn(['New', 'Good', 'Fair', 'Poor', 'Damaged'])
      .withMessage('Condition must be one of: New, Good, Fair, Poor, Damaged'),
    body('location')
      .trim()
      .notEmpty()
      .withMessage('Location is required'),
    body('photos')
      .optional()
      .isArray()
      .withMessage('Photos must be an array'),
    body('photos.*.url')
      .if(body('photos').exists())
      .notEmpty()
      .withMessage('Photo url is required'),
    body('isBookable')
      .optional()
      .isBoolean()
      .withMessage('isBookable must be a boolean'),
    body('department')
      .optional({ nullable: true })
      .isMongoId()
      .withMessage('Department must be a valid Department ID')
  ],
  validate,
  assetController.createAsset
);

// PUT /api/assets/:id (Admin or Asset Manager write only)
router.put(
  '/:id',
  requireRole('Admin', 'Asset Manager'),
  [
    body('name')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('Asset name cannot be empty'),
    body('location')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('Location cannot be empty'),
    body('condition')
      .optional()
      .isIn(['New', 'Good', 'Fair', 'Poor', 'Damaged'])
      .withMessage('Condition must be one of: New, Good, Fair, Poor, Damaged'),
    body('photos')
      .optional()
      .isArray()
      .withMessage('Photos must be an array'),
    body('photos.*.url')
      .if(body('photos').exists())
      .notEmpty()
      .withMessage('Photo url is required'),
    body('isBookable')
      .optional()
      .isBoolean()
      .withMessage('isBookable must be a boolean'),
    body('department')
      .optional({ nullable: true })
      .isMongoId()
      .withMessage('Department must be a valid Department ID')
  ],
  validate,
  assetController.updateAsset
);

// DELETE /api/assets/:id (Admin or Asset Manager only)
router.delete('/:id', requireRole('Admin', 'Asset Manager'), assetController.deleteAsset);

module.exports = router;
