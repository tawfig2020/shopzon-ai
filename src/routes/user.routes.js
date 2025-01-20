const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { check } = require('express-validator');

const {
    registerUser,
    loginUser,
    getCurrentUser,
    updateUser,
    deleteUser
} = require('../controllers/user.controller');

// Register user
router.post('/register', [
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password must be 6 or more characters').isLength({ min: 6 })
], registerUser);

// Login user
router.post('/login', [
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password is required').exists()
], loginUser);

// Get current user
router.get('/me', auth, getCurrentUser);

// Update user
router.put('/me', auth, updateUser);

// Delete user
router.delete('/me', auth, deleteUser);

module.exports = router;
