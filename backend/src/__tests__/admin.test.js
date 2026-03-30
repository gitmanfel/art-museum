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
  let createdCollectionId;
  let createdExhibitionId;
  let createdCollectionUpdatedAt;
  let createdExhibitionUpdatedAt;

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
      .get('/api/admin/orders?page=1&pageSize=10')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(Array.isArray(res.body.orders)).toBe(true);
    expect(res.body).toHaveProperty('meta');
  });

  it('returns users list for admins', async () => {
    const res = await request(app)
      .get('/api/admin/users?page=1&pageSize=10&search=admin')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(Array.isArray(res.body.users)).toBe(true);
    expect(res.body).toHaveProperty('meta');
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
    expect(res.body.collection).toHaveProperty('updated_at');
    createdCollectionId = res.body.collection.id;
    createdCollectionUpdatedAt = res.body.collection.updated_at;
  });

  it('creates an exhibition as admin', async () => {
    const res = await request(app)
      .post('/api/admin/exhibitions')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'New Futures', artist: 'Various' })
      .expect(201);

    expect(res.body.exhibition).toHaveProperty('id');
    expect(res.body.exhibition).toHaveProperty('name', 'New Futures');
    expect(res.body.exhibition).toHaveProperty('updated_at');
    createdExhibitionId = res.body.exhibition.id;
    createdExhibitionUpdatedAt = res.body.exhibition.updated_at;
  });

  it('updates a collection as admin', async () => {
    const res = await request(app)
      .patch(`/api/admin/collections/${createdCollectionId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Modern Installations Updated',
        expectedUpdatedAt: createdCollectionUpdatedAt,
      })
      .expect(200);

    expect(res.body.collection).toHaveProperty('name', 'Modern Installations Updated');
    createdCollectionUpdatedAt = res.body.collection.updated_at;
  });

  it('updates an exhibition as admin', async () => {
    const res = await request(app)
      .patch(`/api/admin/exhibitions/${createdExhibitionId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        artist: 'Various Artists',
        expectedUpdatedAt: createdExhibitionUpdatedAt,
      })
      .expect(200);

    expect(res.body.exhibition).toHaveProperty('artist', 'Various Artists');
    createdExhibitionUpdatedAt = res.body.exhibition.updated_at;
  });

  it('returns conflict if expectedUpdatedAt is stale', async () => {
    await request(app)
      .patch(`/api/admin/collections/${createdCollectionId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Stale Update',
        expectedUpdatedAt: 1,
      })
      .expect(409);
  });

  it('deletes a collection as admin', async () => {
    await request(app)
      .delete(`/api/admin/collections/${createdCollectionId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
  });

  it('deletes an exhibition as admin', async () => {
    await request(app)
      .delete(`/api/admin/exhibitions/${createdExhibitionId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
  });

  it('returns paged audit logs', async () => {
    const res = await request(app)
      .get('/api/admin/audit-logs?page=1&pageSize=10&search=collection')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(Array.isArray(res.body.auditLogs)).toBe(true);
    expect(res.body).toHaveProperty('meta');
  });
});
