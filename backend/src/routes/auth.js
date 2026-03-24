const express = require('express');
const router = express.Router();
const { register, login } = require('../controllers/auth');

// Apply basic rate limiting logic for login/register in production
// (Placeholder - e.g. using express-rate-limit)

// POST /api/auth/register
router.post('/register', register);

// POST /api/auth/login
router.post('/login', login);

module.exports = router;
