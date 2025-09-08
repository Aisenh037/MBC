// routes/authRoute.js
const express = require('express');
const { login, logout, register, getMe, forgotPassword, resetPassword } = require('../controllers/authController.js');
const { protect } = require('../middleware/auth.js');

const router = express.Router();

// Login
router.post('/login', login);

// Logout (protected)
router.post('/logout', protect, logout);

// Register (optional — remove if not needed)
router.post('/register', register);

// Forgot password
router.post('/forgot-password', forgotPassword);

// Reset password
router.post('/reset-password', resetPassword);

// Get current user (protected)
router.get('/me', protect, getMe);

module.exports = router;
