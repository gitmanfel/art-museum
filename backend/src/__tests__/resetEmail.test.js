const nodemailer = require('nodemailer');
const { buildResetLink, sendResetPasswordEmail, isSmtpConfigured } = require('../services/resetEmail');

jest.mock('nodemailer', () => ({
  createTransport: jest.fn(),
}));

describe('resetEmail service', () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...ORIGINAL_ENV };
    delete process.env.FRONTEND_RESET_URL;
    delete process.env.SMTP_HOST;
    delete process.env.SMTP_PORT;
    delete process.env.SMTP_USER;
    delete process.env.SMTP_PASS;
    delete process.env.SMTP_FROM;
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  it('builds reset link using default frontend URL', () => {
    const link = buildResetLink({ token: 'abc123', email: 'user@example.com' });
    expect(link).toContain('http://localhost:19006/reset-password');
    expect(link).toContain('token=abc123');
    expect(link).toContain('email=user%40example.com');
  });

  it('builds reset link using custom frontend URL', () => {
    process.env.FRONTEND_RESET_URL = 'https://museum.app/reset';
    const link = buildResetLink({ token: 'abc123', email: 'user@example.com' });
    expect(link).toContain('https://museum.app/reset');
  });

  it('returns delivered=true in non-production without SMTP', async () => {
    process.env.NODE_ENV = 'test';
    const result = await sendResetPasswordEmail({
      email: 'user@example.com',
      resetLink: 'https://museum.app/reset?token=abc',
    });

    expect(result).toEqual({ delivered: true });
    expect(nodemailer.createTransport).not.toHaveBeenCalled();
  });

  it('returns smtp_not_configured in production when config is missing', async () => {
    process.env.NODE_ENV = 'production';

    const result = await sendResetPasswordEmail({
      email: 'user@example.com',
      resetLink: 'https://museum.app/reset?token=abc',
    });

    expect(result).toEqual({ delivered: false, reason: 'smtp_not_configured' });
    expect(isSmtpConfigured()).toBe(false);
  });

  it('sends reset email in production when SMTP is configured', async () => {
    process.env.NODE_ENV = 'production';
    process.env.SMTP_HOST = 'smtp.example.com';
    process.env.SMTP_PORT = '587';
    process.env.SMTP_USER = 'apikey';
    process.env.SMTP_PASS = 'secret';
    process.env.SMTP_FROM = 'no-reply@museum.app';

    const sendMail = jest.fn().mockResolvedValue({ messageId: '123' });
    nodemailer.createTransport.mockReturnValue({ sendMail });

    const result = await sendResetPasswordEmail({
      email: 'user@example.com',
      resetLink: 'https://museum.app/reset?token=abc',
    });

    expect(result).toEqual({ delivered: true });
    expect(nodemailer.createTransport).toHaveBeenCalledWith({
      host: 'smtp.example.com',
      port: 587,
      secure: false,
      auth: {
        user: 'apikey',
        pass: 'secret',
      },
    });
    expect(sendMail).toHaveBeenCalledTimes(1);
    expect(sendMail.mock.calls[0][0]).toMatchObject({
      from: 'no-reply@museum.app',
      to: 'user@example.com',
      subject: 'Reset your Art Museum password',
    });
  });
});
