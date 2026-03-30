const { isSmtpConfigured } = require('./resetEmail');

const JWT_FALLBACK_SECRET = 'fallback_secret';

const validateRuntimeConfig = (env = process.env) => {
  const errors = [];
  const isProduction = env.NODE_ENV === 'production';

  if (!isProduction) {
    return { valid: true, errors };
  }

  const jwtSecret = (env.JWT_SECRET || '').trim();
  if (!jwtSecret || jwtSecret === JWT_FALLBACK_SECRET) {
    errors.push('JWT_SECRET must be set to a non-fallback value in production.');
  }

  const requireSmtp = String(env.REQUIRE_SMTP_IN_PRODUCTION || 'false').toLowerCase() === 'true';
  if (requireSmtp && !isSmtpConfigured()) {
    errors.push(
      'SMTP must be fully configured in production when REQUIRE_SMTP_IN_PRODUCTION=true.'
    );
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

module.exports = {
  validateRuntimeConfig,
};
