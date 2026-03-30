'use strict';

const request = require('supertest');
const app     = require('../app');
const { closeDb } = require('../db/database');

describe('Catalogue Endpoints', () => {
  beforeAll(() => closeDb());
  afterAll(() => closeDb());

  describe('GET /api/catalogue/tickets', () => {
    it('returns ticket types', async () => {
      const res = await request(app).get('/api/catalogue/tickets').expect(200);
      expect(Array.isArray(res.body.ticketTypes)).toBe(true);
      expect(res.body.ticketTypes.length).toBeGreaterThan(0);
      expect(res.body.ticketTypes[0]).toHaveProperty('id');
      expect(res.body.ticketTypes[0]).toHaveProperty('name');
      expect(res.body.ticketTypes[0]).toHaveProperty('price');
    });

    it('includes expected ticket types', async () => {
      const res = await request(app).get('/api/catalogue/tickets').expect(200);
      const ids = res.body.ticketTypes.map(t => t.id);
      expect(ids).toContain('ticket-adults');
      expect(ids).toContain('ticket-seniors');
      expect(ids).toContain('ticket-students');
    });
  });

  describe('GET /api/catalogue/memberships', () => {
    it('returns membership tiers', async () => {
      const res = await request(app).get('/api/catalogue/memberships').expect(200);
      expect(Array.isArray(res.body.membershipTiers)).toBe(true);
      expect(res.body.membershipTiers.length).toBeGreaterThan(0);
      expect(res.body.membershipTiers[0]).toHaveProperty('id');
      expect(res.body.membershipTiers[0]).toHaveProperty('name');
      expect(res.body.membershipTiers[0]).toHaveProperty('price');
    });

    it('includes expected membership tiers', async () => {
      const res = await request(app).get('/api/catalogue/memberships').expect(200);
      const ids = res.body.membershipTiers.map(t => t.id);
      expect(ids).toContain('membership-individual');
      expect(ids).toContain('membership-dual');
      expect(ids).toContain('membership-supporter');
    });
  });

  describe('GET /api/catalogue/products', () => {
    it('returns product list', async () => {
      const res = await request(app).get('/api/catalogue/products').expect(200);
      expect(Array.isArray(res.body.products)).toBe(true);
      expect(res.body.products.length).toBeGreaterThan(0);
      expect(res.body.products[0]).toHaveProperty('id');
      expect(res.body.products[0]).toHaveProperty('name');
      expect(res.body.products[0]).toHaveProperty('price');
    });
  });

  describe('GET /api/catalogue/products/:id', () => {
    it('returns a single product', async () => {
      const res = await request(app).get('/api/catalogue/products/product-braun-watch').expect(200);
      expect(res.body.product).toHaveProperty('id', 'product-braun-watch');
      expect(res.body.product).toHaveProperty('name');
      expect(res.body.product).toHaveProperty('price');
    });

    it('returns 404 for unknown product', async () => {
      await request(app).get('/api/catalogue/products/not-a-real-product').expect(404);
    });
  });
});
