const nodemailer = require('nodemailer');

const DEFAULT_FRONTEND_RESET_URL = 'http://localhost:19006/reset-password';

const isSmtpConfigured = () => {
  return Boolean(
    process.env.SMTP_HOST &&
      process.env.SMTP_PORT &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS &&
      process.env.SMTP_FROM
  );
};

const getFrontendResetUrl = () => {
  return process.env.FRONTEND_RESET_URL || DEFAULT_FRONTEND_RESET_URL;
};

const buildResetLink = ({ token, email }) => {
  const baseUrl = getFrontendResetUrl();
  const separator = baseUrl.includes('?') ? '&' : '?';
  return `${baseUrl}${separator}token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`;
};

const createTransport = () => {
  const port = Number(process.env.SMTP_PORT);
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

/**
 * Adapter layer for sending reset password links.
 * Swap this implementation with a real provider (SES/SendGrid/etc.) in production.
 */
const sendResetPasswordEmail = async ({ email, resetLink }) => {
  if (process.env.NODE_ENV !== 'production') {
    console.info(`[DEV] Password reset link for ${email}: ${resetLink}`);
    return { delivered: true };
  }

  if (!isSmtpConfigured()) {
    console.warn('Reset password email requested in production, but SMTP is not configured.');
    return { delivered: false, reason: 'smtp_not_configured' };
  }

  try {
    const transporter = createTransport();
    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: email,
      subject: 'Reset your Art Museum password',
      text: `We received a request to reset your password. Use this link: ${resetLink}`,
      html: `<p>We received a request to reset your password.</p><p><a href="${resetLink}">Reset your password</a></p>`,
    });

    return { delivered: true };
  } catch (error) {
    console.error('Failed to send reset password email:', error.message || error);
    return { delivered: false, reason: 'smtp_send_failed' };
  }
};

module.exports = {
  buildResetLink,
  sendResetPasswordEmail,
  isSmtpConfigured,
};
