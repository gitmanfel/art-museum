'use strict';

const request = require('supertest');
const app = require('../app');
const { getDb, closeDb } = require('../db/database');

describe('Contact + Seed Data', () => {
  beforeAll(() => {
    closeDb();
  });

  afterAll(() => {
    closeDb();
  });

  it('accepts contact messages', async () => {
    const res = await request(app)
      .post('/api/contact/message')
      .send({
        name: 'Test Visitor',
        email: 'visitor@example.com',
        subject: 'Opening Hours',
        message: 'What are your hours on Sunday?',
      })
      .expect(201);

    expect(res.body).toHaveProperty('ticketId');

    const row = getDb()
      .prepare('SELECT * FROM contact_messages WHERE id = ?')
      .get(res.body.ticketId);

    expect(row).toBeDefined();
    expect(row.email).toBe('visitor@example.com');
  });

  it('accepts newsletter subscriptions', async () => {
    const res = await request(app)
      .post('/api/contact/subscribe')
      .send({ fullName: 'Alex Visitor', email: 'alex@example.com' })
      .expect(200);

    expect(res.body).toHaveProperty('subscriber');
    expect(res.body.subscriber.email).toBe('alex@example.com');
  });

  it('seeds at least 10 items across catalogue categories', () => {
    const db = getDb();

    const counts = {
      tickets: db.prepare('SELECT COUNT(*) as count FROM ticket_types').get().count,
      memberships: db.prepare('SELECT COUNT(*) as count FROM membership_tiers').get().count,
      products: db.prepare('SELECT COUNT(*) as count FROM products').get().count,
      collections: db.prepare('SELECT COUNT(*) as count FROM collections').get().count,
      exhibitions: db.prepare('SELECT COUNT(*) as count FROM exhibitions').get().count,
    };

    expect(counts.tickets).toBeGreaterThanOrEqual(10);
    expect(counts.memberships).toBeGreaterThanOrEqual(10);
    expect(counts.products).toBeGreaterThanOrEqual(10);
    expect(counts.collections).toBeGreaterThanOrEqual(10);
    expect(counts.exhibitions).toBeGreaterThanOrEqual(10);
  });

  it('seeds communication data for admin workflows', () => {
    const db = getDb();
    const messages = db.prepare('SELECT COUNT(*) as count FROM contact_messages').get().count;
    const subscribers = db.prepare('SELECT COUNT(*) as count FROM newsletter_subscribers').get().count;

    expect(messages).toBeGreaterThanOrEqual(10);
    expect(subscribers).toBeGreaterThanOrEqual(10);
  });
});
