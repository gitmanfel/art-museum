'use strict';

const request = require('supertest');
const app = require('../app');
const { closeDb } = require('../db/database');
const { getDb } = require('../db/database');

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
    expect(res.body).toHaveProperty('fulfilled', true);
    expect(res.body).toHaveProperty('entitlementsChanged', false);

    const user = getDb().prepare('SELECT id FROM users WHERE email = ?').get('checkout@example.com');
    const cartRows = getDb().prepare('SELECT * FROM cart_items WHERE user_id = ?').all(user.id);
    expect(cartRows).toHaveLength(0);
  });

  it('returns checkout status for authenticated user', async () => {
    const res = await request(app)
      .get('/api/checkout/status/pi_mock_ignored_missing')
      .set(auth())
      .expect(200);

    expect(res.body).toEqual({
      fulfilled: false,
      entitlementsChanged: false,
      userRole: 'user',
    });
  });

  it('fulfills successful payment webhook and clears cart', async () => {
    // Ensure cart has items for this user prior to webhook.
    await request(app)
      .post('/api/cart')
      .set(auth())
      .send({ itemType: 'ticket', itemId: 'ticket-adults', quantity: 2 })
      .expect(200);

    const paymentIntentId = 'pi_mock_test_checkout_1';
    const payload = {
      id: 'evt_mock_1',
      type: 'payment_intent.succeeded',
      data: {
        object: {
          id: paymentIntentId,
          amount: 17600,
          amount_received: 17600,
          currency: 'usd',
          metadata: {
            userId: 'checkout@example.com',
          },
        },
      },
    };

    // Replace metadata userId with actual DB user id for this email
    const user = getDb().prepare('SELECT id FROM users WHERE email = ?').get('checkout@example.com');
    payload.data.object.metadata.userId = user.id;

    await request(app)
      .post('/api/checkout/webhook')
      .set('Content-Type', 'application/json')
      .send(payload)
      .expect(200);

    const order = getDb()
      .prepare('SELECT * FROM orders WHERE payment_intent_id = ?')
      .get(paymentIntentId);
    expect(order).toBeDefined();
    expect(order.status).toBe('paid');

    const cartRows = getDb().prepare('SELECT * FROM cart_items WHERE user_id = ?').all(user.id);
    expect(cartRows).toHaveLength(0);
  });

  it('treats duplicate payment webhook as idempotent', async () => {
    const user = getDb().prepare('SELECT id FROM users WHERE email = ?').get('checkout@example.com');

    const payload = {
      id: 'evt_mock_2',
      type: 'payment_intent.succeeded',
      data: {
        object: {
          id: 'pi_mock_test_checkout_2',
          amount: 1000,
          amount_received: 1000,
          currency: 'usd',
          metadata: { userId: user.id },
        },
      },
    };

    await request(app)
      .post('/api/checkout/webhook')
      .set('Content-Type', 'application/json')
      .send(payload)
      .expect(200);

    await request(app)
      .post('/api/checkout/webhook')
      .set('Content-Type', 'application/json')
      .send(payload)
      .expect(200);

    const rows = getDb()
      .prepare('SELECT * FROM orders WHERE payment_intent_id = ?')
      .all('pi_mock_test_checkout_2');

    expect(rows).toHaveLength(1);
  });

  it('upgrades user to member after paid membership and applies member pricing', async () => {
    const user = getDb().prepare('SELECT id FROM users WHERE email = ?').get('checkout@example.com');

    await request(app)
      .post('/api/cart')
      .set(auth())
      .send({ itemType: 'membership', itemId: 'membership-individual', quantity: 1 })
      .expect(200);

    const payload = {
      id: 'evt_mock_member_1',
      type: 'payment_intent.succeeded',
      data: {
        object: {
          id: 'pi_mock_member_1',
          amount: 7500,
          amount_received: 7500,
          currency: 'usd',
          metadata: {
            userId: user.id,
            hasMembership: '1',
          },
        },
      },
    };

    await request(app)
      .post('/api/checkout/webhook')
      .set('Content-Type', 'application/json')
      .send(payload)
      .expect(200);

    const upgraded = getDb().prepare('SELECT role FROM users WHERE id = ?').get(user.id);
    expect(upgraded.role).toBe('member');

    const status = await request(app)
      .get('/api/checkout/status/pi_mock_member_1')
      .set(auth())
      .expect(200);

    expect(status.body).toEqual({
      fulfilled: true,
      entitlementsChanged: true,
      userRole: 'member',
    });

    // Reuse existing token; middleware should read DB role and apply member price.
    const addRes = await request(app)
      .post('/api/cart')
      .set(auth())
      .send({ itemType: 'product', itemId: 'product-braun-watch', quantity: 1 })
      .expect(200);

    const watch = addRes.body.items.find(i => i.item_id === 'product-braun-watch');
    expect(watch.unit_price).toBe(140);
  });
});
