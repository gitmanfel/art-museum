const request = require('supertest');
const app = require('../app');
const { closeDb } = require('../db/database');

describe('Authentication Endpoints', () => {
  process.env.ADMIN_EMAILS = 'testuser@example.com';

  // Ensure a fresh in-memory SQLite DB before and after this suite.
  beforeAll(() => closeDb());
  afterAll(() => closeDb());

  const testUser = {
    email: 'testuser@example.com',
    password: 'SecurePassword123!',
  };
  const standardUser = {
    email: 'member@example.com',
    password: 'SecurePassword123!',
  };
  let authToken;
  let standardUserToken;
  let resetToken;

  it('should successfully register a new user', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send(testUser)
      .expect('Content-Type', /json/)
      .expect(201);

    expect(response.body).toHaveProperty('message', 'User registered successfully');
    expect(response.body).toHaveProperty('token');
    expect(response.body.user).toHaveProperty('email', testUser.email);
    expect(response.body.user).toHaveProperty('role', 'admin');
    authToken = response.body.token;
  });

  it('should register a non-admin user', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send(standardUser)
      .expect('Content-Type', /json/)
      .expect(201);

    expect(response.body.user).toHaveProperty('email', standardUser.email);
    expect(response.body.user).toHaveProperty('role', 'user');
  });

  it('should not register a user with an existing email', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send(testUser)
      .expect('Content-Type', /json/)
      .expect(409);

    expect(response.body).toHaveProperty('error', 'User already exists');
  });

  it('should require email and password for registration', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({ email: 'onlyemail@test.com' })
      .expect(400);

    expect(response.body).toHaveProperty('error', 'Email and password are required');
  });

  it('should reject weak passwords during registration', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({ email: 'weak@example.com', password: 'weakpass' })
      .expect(400);

    expect(response.body).toHaveProperty(
      'error',
      'Password must be at least 10 characters and include uppercase, lowercase, number, and special character'
    );
  });

  it('should successfully login an existing user', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send(testUser)
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body).toHaveProperty('message', 'Login successful');
    expect(response.body).toHaveProperty('token');
    expect(response.body.user).toHaveProperty('email', testUser.email);
  });

  it('should reject login with invalid credentials', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: testUser.email, password: 'wrongpassword' })
      .expect(401);

    expect(response.body).toHaveProperty('error', 'Invalid credentials');
  });

  it('should block access to /me without a token', async () => {
    const response = await request(app)
      .get('/api/auth/me')
      .expect(401);

    expect(response.body).toHaveProperty('error', 'Authentication required');
  });

  it('should return authenticated user profile from /me', async () => {
    const response = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${authToken}`)
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body.user).toHaveProperty('email', testUser.email);
    expect(response.body.user).toHaveProperty('id');
  });

  it('should return generic success message for forgot password', async () => {
    const response = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: testUser.email })
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body).toHaveProperty(
      'message',
      'If an account exists for this email, a reset link has been sent.'
    );
    expect(response.body).toHaveProperty('resetToken');
    expect(response.body).toHaveProperty('resetLink');
    resetToken = response.body.resetToken;
  });

  it('should require email for forgot password', async () => {
    const response = await request(app)
      .post('/api/auth/forgot-password')
      .send({})
      .expect('Content-Type', /json/)
      .expect(400);

    expect(response.body).toHaveProperty('error', 'Email is required');
  });

  it('should reject reset password without token/newPassword', async () => {
    const response = await request(app)
      .post('/api/auth/reset-password')
      .send({ token: resetToken })
      .expect('Content-Type', /json/)
      .expect(400);

    expect(response.body).toHaveProperty('error', 'Token and newPassword are required');
  });

  it('should reject reset password with weak new password', async () => {
    const response = await request(app)
      .post('/api/auth/reset-password')
      .send({ token: resetToken, newPassword: 'weakpass' })
      .expect('Content-Type', /json/)
      .expect(400);

    expect(response.body).toHaveProperty(
      'error',
      'Password must be at least 10 characters and include uppercase, lowercase, number, and special character'
    );
  });

  it('should reset password with a valid token', async () => {
    const response = await request(app)
      .post('/api/auth/reset-password')
      .send({ token: resetToken, newPassword: 'NewSecurePass123!' })
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body).toHaveProperty('message', 'Password reset successful');
  });

  it('should reject reused reset token', async () => {
    const response = await request(app)
      .post('/api/auth/reset-password')
      .send({ token: resetToken, newPassword: 'AnotherStrongPass123!' })
      .expect('Content-Type', /json/)
      .expect(400);

    expect(response.body).toHaveProperty('error', 'Invalid or expired reset token');
  });

  it('should reject old password after reset', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send(testUser)
      .expect('Content-Type', /json/)
      .expect(401);

    expect(response.body).toHaveProperty('error', 'Invalid credentials');
  });

  it('should login with new password after reset', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: testUser.email, password: 'NewSecurePass123!' })
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body).toHaveProperty('message', 'Login successful');
    expect(response.body.user).toHaveProperty('email', testUser.email);
    expect(response.body.user).toHaveProperty('role', 'admin');
  });

  it('should login non-admin user', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send(standardUser)
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body.user).toHaveProperty('email', standardUser.email);
    expect(response.body.user).toHaveProperty('role', 'user');
    standardUserToken = response.body.token;
  });

  it('should expose non-sensitive email readiness status', async () => {
    const response = await request(app)
      .get('/api/auth/email-status')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body).toHaveProperty('emailDelivery');
    expect(response.body.emailDelivery).toHaveProperty('mode');
    expect(response.body.emailDelivery).toHaveProperty('smtpConfigured');
  });

  it('should block diagnostics without a token', async () => {
    const response = await request(app)
      .get('/api/auth/diagnostics')
      .expect(401);

    expect(response.body).toHaveProperty('error', 'Authentication required');
  });

  it('should block diagnostics for non-admin users', async () => {
    const response = await request(app)
      .get('/api/auth/diagnostics')
      .set('Authorization', `Bearer ${standardUserToken}`)
      .expect(403);

    expect(response.body).toHaveProperty('error', 'Admin access required');
  });

  it('should return protected diagnostics for admin users', async () => {
    const response = await request(app)
      .get('/api/auth/diagnostics')
      .set('Authorization', `Bearer ${authToken}`)
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body).toHaveProperty('diagnostics');
    expect(response.body.diagnostics).toHaveProperty('environment');
    expect(response.body.diagnostics).toHaveProperty('security');
    expect(response.body.diagnostics).toHaveProperty('emailDelivery');
    expect(response.body.diagnostics.security).toHaveProperty('jwt');
    expect(response.body.diagnostics.security).toHaveProperty('authRateLimit');
  });
});
