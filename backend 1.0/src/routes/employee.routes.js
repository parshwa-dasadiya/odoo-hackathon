const express = require('express');
const { body } = require('express-validator');
const employeeController = require('../controllers/employee.controller');
const validate = require('../middleware/validate.middleware');
const { verifyToken, requireRole } = require('../middleware/auth.middleware');

const router = express.Router();

// Apply auth protection globally to all employee routes
router.use(verifyToken);

// GET /api/employees (Allowed for Admin, Asset Manager, or Department Head)
router.get(
  '/',
  requireRole('Admin', 'Asset Manager', 'Department Head'),
  employeeController.getEmployees
);

// PATCH /api/employees/:id/role (Admin only promotion/role assignment endpoint)
// ** This is the ONLY endpoint anywhere in the backend allowed to change a user's role **
router.patch(
  '/:id/role',
  requireRole('Admin'),
  [
    body('role')
      .optional()
      .isIn(['Admin', 'Asset Manager', 'Department Head', 'Employee', 'Auditor'])
      .withMessage('Role must be one of: Admin, Asset Manager, Department Head, Employee, Auditor'),
    body('department')
      .optional({ nullable: true })
      .isMongoId()
      .withMessage('Department must be a valid Mongo ID')
  ],
  validate,
  employeeController.patchRole
);

// PATCH /api/employees/:id/status (Admin only status setting / offboarding check)
router.patch(
  '/:id/status',
  requireRole('Admin'),
  [
    body('status')
      .isIn(['Active', 'Inactive'])
      .withMessage('Status must be Active or Inactive')
  ],
  validate,
  employeeController.patchStatus
);

module.exports = router;
