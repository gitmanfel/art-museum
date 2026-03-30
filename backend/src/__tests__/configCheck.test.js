const { validateRuntimeConfig } = require('../services/configCheck');

describe('configCheck service', () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV };
    delete process.env.SMTP_HOST;
    delete process.env.SMTP_PORT;
    delete process.env.SMTP_USER;
    delete process.env.SMTP_PASS;
    delete process.env.SMTP_FROM;
    delete process.env.JWT_SECRET;
    delete process.env.REQUIRE_SMTP_IN_PRODUCTION;
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  it('passes in non-production by default', () => {
    process.env.NODE_ENV = 'test';

    const result = validateRuntimeConfig(process.env);

    expect(result).toEqual({ valid: true, errors: [] });
  });

  it('fails in production when JWT_SECRET is missing', () => {
    process.env.NODE_ENV = 'production';

    const result = validateRuntimeConfig(process.env);

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('JWT_SECRET must be set to a non-fallback value in production.');
  });

  it('fails in production when JWT_SECRET is fallback_secret', () => {
    process.env.NODE_ENV = 'production';
    process.env.JWT_SECRET = 'fallback_secret';

    const result = validateRuntimeConfig(process.env);

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('JWT_SECRET must be set to a non-fallback value in production.');
  });

  it('fails in production when SMTP is required but not configured', () => {
    process.env.NODE_ENV = 'production';
    process.env.JWT_SECRET = 'real-production-secret';
    process.env.REQUIRE_SMTP_IN_PRODUCTION = 'true';

    const result = validateRuntimeConfig(process.env);

    expect(result.valid).toBe(false);
    expect(result.errors).toContain(
      'SMTP must be fully configured in production when REQUIRE_SMTP_IN_PRODUCTION=true.'
    );
  });

  it('passes in production with JWT and required SMTP configured', () => {
    process.env.NODE_ENV = 'production';
    process.env.JWT_SECRET = 'real-production-secret';
    process.env.REQUIRE_SMTP_IN_PRODUCTION = 'true';
    process.env.SMTP_HOST = 'smtp.example.com';
    process.env.SMTP_PORT = '587';
    process.env.SMTP_USER = 'apikey';
    process.env.SMTP_PASS = 'secret';
    process.env.SMTP_FROM = 'no-reply@museum.app';

    const result = validateRuntimeConfig(process.env);

    expect(result).toEqual({ valid: true, errors: [] });
  });
});
