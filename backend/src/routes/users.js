const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const userController = require('../controllers/user.controller');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');

// Validation rules
const updateProfileValidation = [
  body('name').optional().trim().notEmpty(),
  body('email').optional().isEmail().normalizeEmail(),
  body('password').optional().isLength({ min: 6 }),
];

// Routes
router.get('/profile', auth, userController.getProfile);
router.put('/profile', auth, validate(updateProfileValidation), userController.updateProfile);
router.delete('/profile', auth, userController.deleteProfile);

module.exports = router;
