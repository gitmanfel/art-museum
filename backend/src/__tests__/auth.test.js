const request = require('supertest');
const app = require('../app');

describe('Authentication Endpoints', () => {
  const testUser = {
    email: 'testuser@example.com',
    password: 'SecurePassword123!',
  };

  it('should successfully register a new user', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send(testUser)
      .expect('Content-Type', /json/)
      .expect(201);

    expect(response.body).toHaveProperty('message', 'User registered successfully');
    expect(response.body).toHaveProperty('token');
    expect(response.body.user).toHaveProperty('email', testUser.email);
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
});
