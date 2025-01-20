const { validationResult } = require('express-validator');
const { logger } = require('../config/init');

/**
 * Middleware to validate request using express-validator
 * @param {Array} validations - Array of validation middleware
 * @returns {Function} Express middleware function
 */
const validate = (validations) => {
  return async (req, res, next) => {
    // Run all validations
    await Promise.all(validations.map(validation => validation.run(req)));

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.warn('Validation failed:', { 
        path: req.path, 
        errors: errors.array() 
      });
      
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    next();
  };
};

module.exports = validate;
