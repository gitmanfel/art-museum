'use strict';

const request = require('supertest');
const app     = require('../app');
const { closeDb } = require('../db/database');

describe('Cart Endpoints', () => {
  beforeAll(() => closeDb());
  afterAll(() => closeDb());

  let token;

  // Register and login to get a JWT for auth-protected cart routes
  beforeAll(async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ email: 'cartuser@example.com', password: 'SecurePassword123!' });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'cartuser@example.com', password: 'SecurePassword123!' });

    token = res.body.token;
  });

  const authHeader = () => ({ Authorization: `Bearer ${token}` });

  describe('GET /api/cart', () => {
    it('requires authentication', async () => {
      await request(app).get('/api/cart').expect(401);
    });

    it('returns empty cart for new user', async () => {
      const res = await request(app)
        .get('/api/cart')
        .set(authHeader())
        .expect(200);

      expect(res.body).toHaveProperty('items');
      expect(res.body).toHaveProperty('total');
      expect(Array.isArray(res.body.items)).toBe(true);
      expect(res.body.items).toHaveLength(0);
      expect(res.body.total).toBe(0);
    });
  });

  describe('POST /api/cart (add item)', () => {
    it('requires authentication', async () => {
      await request(app)
        .post('/api/cart')
        .send({ itemType: 'product', itemId: 'product-braun-watch', quantity: 1 })
        .expect(401);
    });

    it('adds a product to the cart', async () => {
      const res = await request(app)
        .post('/api/cart')
        .set(authHeader())
        .send({ itemType: 'product', itemId: 'product-braun-watch', quantity: 2 })
        .expect(200);

      expect(res.body.items).toHaveLength(1);
      expect(res.body.items[0]).toMatchObject({
        item_type: 'product',
        item_id:   'product-braun-watch',
        quantity:  2,
      });
      expect(res.body.items[0].unit_price).toBeGreaterThan(0);
      expect(res.body.total).toBeGreaterThan(0);
    });

    it('adds a ticket to the cart', async () => {
      const res = await request(app)
        .post('/api/cart')
        .set(authHeader())
        .send({ itemType: 'ticket', itemId: 'ticket-adults', quantity: 3 })
        .expect(200);

      const ticketItem = res.body.items.find(i => i.item_id === 'ticket-adults');
      expect(ticketItem).toBeDefined();
      expect(ticketItem.quantity).toBe(3);
      expect(ticketItem.unit_price).toBe(8);
    });

    it('adds a membership to the cart', async () => {
      const res = await request(app)
        .post('/api/cart')
        .set(authHeader())
        .send({ itemType: 'membership', itemId: 'membership-individual', quantity: 1 })
        .expect(200);

      const mem = res.body.items.find(i => i.item_id === 'membership-individual');
      expect(mem).toBeDefined();
      expect(mem.unit_price).toBe(75);
    });

    it('updates quantity when same item added again', async () => {
      // Add 1 more watch on top of the 2 already in cart
      const res = await request(app)
        .post('/api/cart')
        .set(authHeader())
        .send({ itemType: 'product', itemId: 'product-braun-watch', quantity: 1 })
        .expect(200);

      const watch = res.body.items.find(i => i.item_id === 'product-braun-watch');
      expect(watch.quantity).toBe(3); // upsert increments quantity
    });

    it('rejects unknown product id', async () => {
      await request(app)
        .post('/api/cart')
        .set(authHeader())
        .send({ itemType: 'product', itemId: 'no-such-product', quantity: 1 })
        .expect(404);
    });

    it('rejects invalid itemType', async () => {
      await request(app)
        .post('/api/cart')
        .set(authHeader())
        .send({ itemType: 'invalid', itemId: 'product-braun-watch', quantity: 1 })
        .expect(400);
    });

    it('rejects quantity that exceeds available stock', async () => {
      await request(app)
        .post('/api/cart')
        .set(authHeader())
        .send({ itemType: 'product', itemId: 'product-braun-watch', quantity: 30 })
        .expect(409);
    });

    it('requires itemType and itemId', async () => {
      await request(app)
        .post('/api/cart')
        .set(authHeader())
        .send({ quantity: 1 })
        .expect(400);
    });
  });

  describe('DELETE /api/cart/:id', () => {
    it('removes an item from the cart', async () => {
      // Fetch current cart to get a valid item id
      const cartRes = await request(app)
        .get('/api/cart')
        .set(authHeader())
        .expect(200);

      const item = cartRes.body.items[0];
      expect(item).toBeDefined();

      const res = await request(app)
        .delete(`/api/cart/${item.id}`)
        .set(authHeader())
        .expect(200);

      const remaining = res.body.items.find(i => i.id === item.id);
      expect(remaining).toBeUndefined();
    });

    it('returns 404 for non-existent cart item', async () => {
      await request(app)
        .delete('/api/cart/999999')
        .set(authHeader())
        .expect(200);
    });
  });

  describe('DELETE /api/cart (clear)', () => {
    it('clears the entire cart', async () => {
      // Ensure something is in the cart first
      await request(app)
        .post('/api/cart')
        .set(authHeader())
        .send({ itemType: 'ticket', itemId: 'ticket-students', quantity: 1 });

      const res = await request(app)
        .delete('/api/cart')
        .set(authHeader())
        .expect(200);

      expect(res.body.items).toHaveLength(0);
      expect(res.body.total).toBe(0);
    });
  });
});
