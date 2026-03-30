const { isSmtpConfigured } = require('./resetEmail');
const JWT_FALLBACK_SECRET = 'fallback_secret';

const getJwtStartupStatus = () => {
  const production = process.env.NODE_ENV === 'production';
  const configuredJwtSecret = Boolean(process.env.JWT_SECRET && String(process.env.JWT_SECRET).trim());
  const usingFallbackSecret = !configuredJwtSecret || process.env.JWT_SECRET === JWT_FALLBACK_SECRET;

  return {
    configuredJwtSecret,
    usingFallbackSecret,
    shouldFailFast: production && usingFallbackSecret,
  };
};

const logJwtStartupStatus = () => {
  const status = getJwtStartupStatus();

  if (status.shouldFailFast) {
    console.error('[Startup] JWT secret is missing or using fallback in production. Startup must fail.');
    return status;
  }

  if (status.usingFallbackSecret) {
    console.warn('[Startup] JWT is using fallback secret (allowed outside production only).');
    return status;
  }

  console.info('[Startup] JWT secret is configured.');
  return status;
};

const getEmailDeliveryStartupStatus = () => {
  const production = process.env.NODE_ENV === 'production';
  const smtpConfigured = isSmtpConfigured();

  return {
    mode: production ? 'smtp' : 'development',
    smtpConfigured,
    shouldWarn: production && !smtpConfigured,
  };
};

const logEmailDeliveryStartupStatus = () => {
  const status = getEmailDeliveryStartupStatus();

  if (status.mode === 'development') {
    console.info('[Startup] Email delivery mode: development (reset links logged and returned for testing).');
    return status;
  }

  if (status.shouldWarn) {
    console.warn('[Startup] Email delivery mode: smtp, but SMTP is not fully configured.');
    return status;
  }

  console.info('[Startup] Email delivery mode: smtp (configured).');
  return status;
};

const assertProductionSecurityConfig = () => {
  const jwtStatus = logJwtStartupStatus();
  if (jwtStatus.shouldFailFast) {
    throw new Error('Unsafe JWT configuration for production startup');
  }

  return jwtStatus;
};

module.exports = {
  getJwtStartupStatus,
  logJwtStartupStatus,
  assertProductionSecurityConfig,
  getEmailDeliveryStartupStatus,
  logEmailDeliveryStartupStatus,
};
