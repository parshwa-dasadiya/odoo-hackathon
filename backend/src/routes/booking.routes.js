const express = require('express');
const { body, query } = require('express-validator');
const bookingController = require('../controllers/booking.controller');
const validate = require('../middleware/validate.middleware');
const { verifyToken, requireRole } = require('../middleware/auth.middleware');

const router = express.Router();

// Apply auth protection globally
router.use(verifyToken);

// GET /api/bookings/my
router.get('/my', bookingController.getMyBookings);

// GET /api/bookings/upcoming-reminders
router.get(
  '/upcoming-reminders',
  [
    query('withinMinutes')
      .optional()
      .isInt({ min: 1 })
      .withMessage('withinMinutes must be a positive integer')
  ],
  validate,
  bookingController.getUpcomingReminders
);

// GET /api/bookings/resource/:assetId
router.get(
  '/resource/:assetId',
  bookingController.getResourceBookings
);

// GET /api/bookings (List all - useful for heatmap/reports)
router.get('/', bookingController.getAllBookings);

// POST /api/bookings
router.post(
  '/',
  [
    body('resourceId')
      .isMongoId()
      .withMessage('resourceId must be a valid Mongo ID'),
    body('startTime')
      .isISO8601()
      .withMessage('startTime must be a valid ISO8601 date'),
    body('endTime')
      .isISO8601()
      .withMessage('endTime must be a valid ISO8601 date'),
    body('purpose')
      .trim()
      .notEmpty()
      .withMessage('purpose is required'),
    body('department')
      .optional()
      .isMongoId()
      .withMessage('department must be a valid Mongo ID')
  ],
  validate,
  bookingController.createBooking
);

// PATCH /api/bookings/:id/reschedule
router.patch(
  '/:id/reschedule',
  [
    body('newStartTime')
      .isISO8601()
      .withMessage('newStartTime must be a valid ISO8601 date'),
    body('newEndTime')
      .isISO8601()
      .withMessage('newEndTime must be a valid ISO8601 date')
  ],
  validate,
  bookingController.rescheduleBooking
);

// PATCH /api/bookings/:id/cancel
router.patch(
  '/:id/cancel',
  [
    body('cancelReason')
      .trim()
      .notEmpty()
      .withMessage('cancelReason is required')
  ],
  validate,
  bookingController.cancelBooking
);

module.exports = router;
