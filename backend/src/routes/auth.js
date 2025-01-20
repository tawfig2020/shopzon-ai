const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authController = require('../controllers/auth.controller');
const validate = require('../middleware/validate');

// Validation rules
const loginValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
];

const registerValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('name').trim().notEmpty(),
];

// Routes
router.post('/login', validate(loginValidation), authController.login);
router.post('/register', validate(registerValidation), authController.register);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);

module.exports = router;
