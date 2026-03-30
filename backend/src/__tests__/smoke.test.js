'use strict';

const request = require('supertest');
const app = require('../app');
const userRepo = require('../db/userRepository');
const { closeDb, getDb } = require('../db/database');

describe('Critical Flow Smoke Tests', () => {
  beforeAll(() => {
    closeDb();
    delete process.env.STRIPE_SECRET_KEY;
  });

  afterAll(() => closeDb());

  let memberToken;
  let adminToken;

  const auth = (token) => ({ Authorization: `Bearer ${token}` });

  it('member checkout upgrades role and uses member pricing', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ email: 'smoke-member@example.com', password: 'SecurePassword123!' })
      .expect(201);

    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'smoke-member@example.com', password: 'SecurePassword123!' })
      .expect(200);
    memberToken = login.body.token;

    await request(app)
      .post('/api/cart')
      .set(auth(memberToken))
      .send({ itemType: 'membership', itemId: 'membership-individual', quantity: 1 })
      .expect(200);

    await request(app)
      .post('/api/checkout/intent')
      .set(auth(memberToken))
      .set('Idempotency-Key', 'smoke-member-upgrade')
      .expect(200);

    const user = userRepo.findByEmail('smoke-member@example.com');
    expect(user.role).toBe('member');

    const addRes = await request(app)
      .post('/api/cart')
      .set(auth(memberToken))
      .send({ itemType: 'product', itemId: 'product-braun-watch', quantity: 1 })
      .expect(200);

    const watch = addRes.body.items.find((i) => i.item_id === 'product-braun-watch');
    expect(watch.unit_price).toBe(140);
  });

  it('admin content lifecycle create-update-delete works with optimistic lock', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ email: 'smoke-admin@example.com', password: 'SecurePassword123!' })
      .expect(201);

    const admin = userRepo.findByEmail('smoke-admin@example.com');
    userRepo.updateRole(admin.id, 'admin');

    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'smoke-admin@example.com', password: 'SecurePassword123!' })
      .expect(200);
    adminToken = login.body.token;

    const create = await request(app)
      .post('/api/admin/collections')
      .set(auth(adminToken))
      .send({ name: 'Smoke Collection', category: 'test' })
      .expect(201);

    const id = create.body.collection.id;
    const updatedAt = create.body.collection.updated_at;

    const update = await request(app)
      .patch(`/api/admin/collections/${id}`)
      .set(auth(adminToken))
      .send({ name: 'Smoke Collection Updated', expectedUpdatedAt: updatedAt })
      .expect(200);

    expect(update.body.collection.name).toBe('Smoke Collection Updated');

    await request(app)
      .delete(`/api/admin/collections/${id}`)
      .set(auth(adminToken))
      .expect(200);
  });

  it('inventory reservation blocks oversell across users', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ email: 'reserve-a@example.com', password: 'SecurePassword123!' })
      .expect(201);

    await request(app)
      .post('/api/auth/register')
      .send({ email: 'reserve-b@example.com', password: 'SecurePassword123!' })
      .expect(201);

    const loginA = await request(app)
      .post('/api/auth/login')
      .send({ email: 'reserve-a@example.com', password: 'SecurePassword123!' })
      .expect(200);

    const loginB = await request(app)
      .post('/api/auth/login')
      .send({ email: 'reserve-b@example.com', password: 'SecurePassword123!' })
      .expect(200);

    const tokenA = loginA.body.token;
    const tokenB = loginB.body.token;

    getDb().prepare('UPDATE products SET stock_quantity = 1 WHERE id = ?').run('product-poster');

    await request(app)
      .post('/api/cart')
      .set(auth(tokenA))
      .send({ itemType: 'product', itemId: 'product-poster', quantity: 1 })
      .expect(200);

    await request(app)
      .post('/api/checkout/intent')
      .set(auth(tokenA))
      .set('Idempotency-Key', 'reserve-a-intent')
      .expect(200);

    await request(app)
      .post('/api/cart')
      .set(auth(tokenB))
      .send({ itemType: 'product', itemId: 'product-poster', quantity: 1 })
      .expect(409);
  });
});
