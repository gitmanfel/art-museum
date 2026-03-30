const express = require('express');
const router = express.Router();
const { register, login, getMe, forgotPassword, resetPassword, getEmailStatus, getDiagnostics } = require('../controllers/auth');
const { requireAuth, requireAdmin } = require('../middleware/authMiddleware');
const { authRateLimiter } = require('../middleware/authRateLimit');

// Apply basic rate limiting logic for login/register in production
// (Placeholder - e.g. using express-rate-limit)

// POST /api/auth/register
router.post('/register', authRateLimiter, register);

// POST /api/auth/login
router.post('/login', authRateLimiter, login);

// POST /api/auth/forgot-password
router.post('/forgot-password', authRateLimiter, forgotPassword);

// POST /api/auth/reset-password
router.post('/reset-password', authRateLimiter, resetPassword);

// GET /api/auth/me
router.get('/me', requireAuth, getMe);

// GET /api/auth/email-status
router.get('/email-status', getEmailStatus);

// GET /api/auth/diagnostics
router.get('/diagnostics', requireAuth, requireAdmin, getDiagnostics);

module.exports = router;
