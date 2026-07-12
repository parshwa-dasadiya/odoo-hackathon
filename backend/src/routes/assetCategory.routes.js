const express = require('express');
const { body } = require('express-validator');
const assetCategoryController = require('../controllers/assetCategory.controller');
const validate = require('../middleware/validate.middleware');
const { verifyToken, requireRole } = require('../middleware/auth.middleware');

const router = express.Router();

// Apply auth protection globally to all asset category routes
router.use(verifyToken);

// GET /api/asset-categories (all authenticated users can read)
router.get('/', assetCategoryController.getCategories);

// Validation array for customFields shape
const customFieldsValidation = [
  body('customFields')
    .optional()
    .isArray()
    .withMessage('customFields must be an array'),
  body('customFields.*.fieldName')
    .if(body('customFields').exists())
    .notEmpty()
    .withMessage('fieldName inside customFields is required'),
  body('customFields.*.fieldType')
    .if(body('customFields').exists())
    .isIn(['Text', 'Number', 'Date'])
    .withMessage('fieldType must be one of: Text, Number, Date')
];

// POST /api/asset-categories (Admin only write)
router.post(
  '/',
  requireRole('Admin'),
  [
    body('name')
      .trim()
      .notEmpty()
      .withMessage('Asset category name is required'),
    body('description')
      .optional()
      .trim(),
    ...customFieldsValidation
  ],
  validate,
  assetCategoryController.createCategory
);

// PUT /api/asset-categories/:id (Admin only update)
router.put(
  '/:id',
  requireRole('Admin'),
  [
    body('name')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('Asset category name cannot be empty'),
    body('description')
      .optional()
      .trim(),
    ...customFieldsValidation
  ],
  validate,
  assetCategoryController.updateCategory
);

// DELETE /api/asset-categories/:id (Admin only delete)
router.delete('/:id', requireRole('Admin'), assetCategoryController.deleteCategory);

module.exports = router;
