const express = require('express');
const { body } = require('express-validator');
const departmentController = require('../controllers/department.controller');
const validate = require('../middleware/validate.middleware');
const { verifyToken, requireRole } = require('../middleware/auth.middleware');

const router = express.Router();

// Apply auth protection globally to all department routes
router.use(verifyToken);

// GET /api/departments (all authenticated users can read)
router.get('/', departmentController.getDepartments);

// POST /api/departments (Admin only write)
router.post(
  '/',
  requireRole('Admin'),
  [
    body('name')
      .trim()
      .notEmpty()
      .withMessage('Department name is required'),
    body('head')
      .optional({ nullable: true })
      .isMongoId()
      .withMessage('Head must be a valid User ID'),
    body('parentDepartment')
      .optional({ nullable: true })
      .isMongoId()
      .withMessage('Parent Department must be a valid Department ID')
  ],
  validate,
  departmentController.createDepartment
);

// PUT /api/departments/:id (Admin only update)
router.put(
  '/:id',
  requireRole('Admin'),
  [
    body('name')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('Department name cannot be empty'),
    body('head')
      .optional({ nullable: true })
      .isMongoId()
      .withMessage('Head must be a valid User ID'),
    body('parentDepartment')
      .optional({ nullable: true })
      .isMongoId()
      .withMessage('Parent Department must be a valid Department ID'),
    body('status')
      .optional()
      .isIn(['Active', 'Inactive'])
      .withMessage('Status must be Active or Inactive')
  ],
  validate,
  departmentController.updateDepartment
);

// PATCH /api/departments/:id/status (Admin only status patch)
router.patch(
  '/:id/status',
  requireRole('Admin'),
  [
    body('status')
      .isIn(['Active', 'Inactive'])
      .withMessage('Status must be Active or Inactive')
  ],
  validate,
  departmentController.patchStatus
);

module.exports = router;
