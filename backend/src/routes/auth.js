const express = require('express');
const router = express.Router();
const { login, registerTenant, getMe, logout } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

// Public routes
router.post('/login', login);
router.post('/register-tenant', registerTenant);

// Protected routes
router.get('/me', protect, getMe);
router.post('/logout', protect, logout);

module.exports = router;
