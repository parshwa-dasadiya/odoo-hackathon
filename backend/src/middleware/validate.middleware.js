const { validationResult } = require('express-validator');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // Extract first error message or compile all
    const errorMessages = errors.array().map(err => err.msg).join(', ');
    return res.status(400).json({
      success: false,
      message: `Validation failed: ${errorMessages}`,
      errors: errors.array()
    });
  }
  next();
};

module.exports = validate;
