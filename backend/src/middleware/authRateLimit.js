const rateLimit = require('express-rate-limit');

const windowMs = Number(process.env.AUTH_RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000);
const max = Number(process.env.AUTH_RATE_LIMIT_MAX || (process.env.NODE_ENV === 'test' ? 1000 : 10));

/**
 * Rate limit public auth endpoints to mitigate brute-force attempts.
 */
const authRateLimiter = rateLimit({
  windowMs,
  max,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many authentication attempts. Please try again later.',
  },
});

module.exports = {
  authRateLimiter,
};
