const {
  getJwtStartupStatus,
  logJwtStartupStatus,
  assertProductionSecurityConfig,
  getEmailDeliveryStartupStatus,
  logEmailDeliveryStartupStatus,
} = require('../services/startupStatus');

describe('startupStatus service', () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV };
    delete process.env.SMTP_HOST;
    delete process.env.SMTP_PORT;
    delete process.env.SMTP_USER;
    delete process.env.SMTP_PASS;
    delete process.env.SMTP_FROM;
    delete process.env.JWT_SECRET;
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  it('returns development mode outside production', () => {
    process.env.NODE_ENV = 'test';

    const status = getEmailDeliveryStartupStatus();

    expect(status).toEqual({
      mode: 'development',
      smtpConfigured: false,
      shouldWarn: false,
    });
  });

  it('uses fallback JWT outside production without failing fast', () => {
    process.env.NODE_ENV = 'test';

    const status = getJwtStartupStatus();

    expect(status).toEqual({
      configuredJwtSecret: false,
      usingFallbackSecret: true,
      shouldFailFast: false,
    });
  });

  it('fails fast in production when JWT secret is missing', () => {
    process.env.NODE_ENV = 'production';

    const status = getJwtStartupStatus();
    expect(status).toEqual({
      configuredJwtSecret: false,
      usingFallbackSecret: true,
      shouldFailFast: true,
    });

    expect(() => assertProductionSecurityConfig()).toThrow(
      'Unsafe JWT configuration for production startup'
    );
  });

  it('passes production check when JWT secret is configured', () => {
    process.env.NODE_ENV = 'production';
    process.env.JWT_SECRET = 'super-long-production-secret';

    const status = getJwtStartupStatus();
    expect(status).toEqual({
      configuredJwtSecret: true,
      usingFallbackSecret: false,
      shouldFailFast: false,
    });

    expect(() => assertProductionSecurityConfig()).not.toThrow();
  });

  it('warns in production when SMTP is not configured', () => {
    process.env.NODE_ENV = 'production';

    const status = getEmailDeliveryStartupStatus();

    expect(status).toEqual({
      mode: 'smtp',
      smtpConfigured: false,
      shouldWarn: true,
    });
  });

  it('reports configured SMTP in production when all SMTP vars are present', () => {
    process.env.NODE_ENV = 'production';
    process.env.SMTP_HOST = 'smtp.example.com';
    process.env.SMTP_PORT = '587';
    process.env.SMTP_USER = 'apikey';
    process.env.SMTP_PASS = 'secret';
    process.env.SMTP_FROM = 'no-reply@museum.app';

    const status = getEmailDeliveryStartupStatus();

    expect(status).toEqual({
      mode: 'smtp',
      smtpConfigured: true,
      shouldWarn: false,
    });
  });

  it('logs development startup message', () => {
    process.env.NODE_ENV = 'test';
    const infoSpy = jest.spyOn(console, 'info').mockImplementation(() => {});

    const status = logEmailDeliveryStartupStatus();

    expect(status.mode).toBe('development');
    expect(infoSpy).toHaveBeenCalledWith(
      '[Startup] Email delivery mode: development (reset links logged and returned for testing).'
    );

    infoSpy.mockRestore();
  });

  it('logs warning startup message when production SMTP is missing', () => {
    process.env.NODE_ENV = 'production';
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    const status = logEmailDeliveryStartupStatus();

    expect(status.shouldWarn).toBe(true);
    expect(warnSpy).toHaveBeenCalledWith(
      '[Startup] Email delivery mode: smtp, but SMTP is not fully configured.'
    );

    warnSpy.mockRestore();
  });

  it('logs JWT warning when fallback is used outside production', () => {
    process.env.NODE_ENV = 'test';
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    const status = logJwtStartupStatus();

    expect(status.usingFallbackSecret).toBe(true);
    expect(warnSpy).toHaveBeenCalledWith(
      '[Startup] JWT is using fallback secret (allowed outside production only).'
    );

    warnSpy.mockRestore();
  });

  it('logs JWT error when production should fail fast', () => {
    process.env.NODE_ENV = 'production';
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const status = logJwtStartupStatus();

    expect(status.shouldFailFast).toBe(true);
    expect(errorSpy).toHaveBeenCalledWith(
      '[Startup] JWT secret is missing or using fallback in production. Startup must fail.'
    );

    errorSpy.mockRestore();
  });
});
