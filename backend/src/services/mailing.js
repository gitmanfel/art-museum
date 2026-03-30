'use strict';

const nodemailer = require('nodemailer');

const isSmtpConfigured = () => {
  return Boolean(
    process.env.SMTP_HOST &&
      process.env.SMTP_PORT &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS &&
      process.env.SMTP_FROM
  );
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

const sendMail = async ({ to, subject, text, html }) => {
  if (process.env.NODE_ENV !== 'production') {
    console.info(`[DEV MAIL] To: ${to} | Subject: ${subject}`);
    return { delivered: true, mode: 'dev-log' };
  }

  if (!isSmtpConfigured()) {
    return { delivered: false, mode: 'no-smtp' };
  }

  try {
    const transporter = createTransport();
    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to,
      subject,
      text,
      html,
    });
    return { delivered: true, mode: 'smtp' };
  } catch (error) {
    console.error('Mail send failed:', error.message || error);
    return { delivered: false, mode: 'smtp-error' };
  }
};

module.exports = {
  sendMail,
};
