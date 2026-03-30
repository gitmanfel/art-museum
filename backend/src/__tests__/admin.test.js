'use strict';

const request = require('supertest');
const app = require('../app');
const userRepo = require('../db/userRepository');
const { closeDb } = require('../db/database');

describe('Admin Endpoints', () => {
  beforeAll(() => closeDb());
  afterAll(() => closeDb());

  let userToken;
  let adminToken;

  beforeAll(async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ email: 'standard@example.com', password: 'SecurePassword123!' });

    await request(app)
      .post('/api/auth/register')
      .send({ email: 'admin@example.com', password: 'SecurePassword123!' });

    const admin = userRepo.findByEmail('admin@example.com');
    userRepo.updateRole(admin.id, 'admin');

    const userLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'standard@example.com', password: 'SecurePassword123!' });
    userToken = userLogin.body.token;

    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@example.com', password: 'SecurePassword123!' });
    adminToken = adminLogin.body.token;
  });

  it('rejects unauthenticated overview requests', async () => {
    await request(app).get('/api/admin/overview').expect(401);
  });

  it('rejects non-admin users', async () => {
    await request(app)
      .get('/api/admin/overview')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(403);
  });

  it('returns overview for admin users', async () => {
    const res = await request(app)
      .get('/api/admin/overview')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body).toHaveProperty('users');
    expect(res.body).toHaveProperty('orders');
    expect(res.body).toHaveProperty('lowStockProducts');
    expect(res.body).toHaveProperty('recentOrders');
    expect(res.body.users).toHaveProperty('totalUsers');
  });

  it('returns orders list for admins', async () => {
    const res = await request(app)
      .get('/api/admin/orders?limit=10')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(Array.isArray(res.body.orders)).toBe(true);
  });

  it('returns users list for admins', async () => {
    const res = await request(app)
      .get('/api/admin/users?limit=10')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(Array.isArray(res.body.users)).toBe(true);
    if (res.body.users.length > 0) {
      expect(res.body.users[0]).toHaveProperty('email');
      expect(res.body.users[0]).not.toHaveProperty('password');
    }
  });

  it('creates a collection as admin', async () => {
    const res = await request(app)
      .post('/api/admin/collections')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Modern Installations', category: 'contemporary' })
      .expect(201);

    expect(res.body.collection).toHaveProperty('id');
    expect(res.body.collection).toHaveProperty('name', 'Modern Installations');
  });

  it('creates an exhibition as admin', async () => {
    const res = await request(app)
      .post('/api/admin/exhibitions')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'New Futures', artist: 'Various' })
      .expect(201);

    expect(res.body.exhibition).toHaveProperty('id');
    expect(res.body.exhibition).toHaveProperty('name', 'New Futures');
  });
});
