'use strict';

const request = require('supertest');
const app = require('../app');
const { closeDb } = require('../db/database');

describe('Checkout Endpoints', () => {
  beforeAll(() => {
    closeDb();
    delete process.env.STRIPE_SECRET_KEY;
  });

  afterAll(() => closeDb());

  let token;

  beforeAll(async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ email: 'checkout@example.com', password: 'SecurePassword123!' });

    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'checkout@example.com', password: 'SecurePassword123!' });

    token = login.body.token;
  });

  const auth = () => ({ Authorization: `Bearer ${token}` });

  it('requires authentication', async () => {
    await request(app)
      .post('/api/checkout/intent')
      .set('Idempotency-Key', 'k1')
      .expect(401);
  });

  it('requires idempotency key', async () => {
    await request(app)
      .post('/api/checkout/intent')
      .set(auth())
      .expect(400);
  });

  it('rejects checkout for empty cart', async () => {
    await request(app)
      .post('/api/checkout/intent')
      .set(auth())
      .set('Idempotency-Key', 'k2')
      .expect(400);
  });

  it('creates a payment intent from server-side cart total', async () => {
    await request(app)
      .post('/api/cart')
      .set(auth())
      .send({ itemType: 'product', itemId: 'product-braun-watch', quantity: 1 })
      .expect(200);

    const res = await request(app)
      .post('/api/checkout/intent')
      .set(auth())
      .set('Idempotency-Key', 'k3')
      .expect(200);

    expect(res.body).toHaveProperty('provider');
    expect(res.body).toHaveProperty('paymentIntentId');
    expect(res.body).toHaveProperty('clientSecret');
    expect(res.body).toHaveProperty('amountCents', 16000);
    expect(res.body).toHaveProperty('currency', 'usd');
    expect(res.body).toHaveProperty('cartTotal', 160);
  });
});
