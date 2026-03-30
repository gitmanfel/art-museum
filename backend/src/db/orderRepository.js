'use strict';

const { getDb } = require('./database');

const findByPaymentIntentId = (paymentIntentId) =>
  getDb()
    .prepare('SELECT * FROM orders WHERE payment_intent_id = ?')
    .get(paymentIntentId);

const findByPaymentIntentIdForUser = (paymentIntentId, userId) =>
  getDb()
    .prepare('SELECT * FROM orders WHERE payment_intent_id = ? AND user_id = ?')
    .get(paymentIntentId, userId);

const createFulfilledOrder = ({ userId, paymentIntentId, amountCents, currency, provider, entitlementsChanged = false }) => {
  getDb()
    .prepare(
      `INSERT INTO orders (user_id, payment_intent_id, amount_cents, currency, provider, status, entitlements_changed, fulfilled_at)
       VALUES (?, ?, ?, ?, ?, 'paid', ?, unixepoch())`
    )
    .run(userId, paymentIntentId, amountCents, currency, provider, entitlementsChanged ? 1 : 0);

  return findByPaymentIntentId(paymentIntentId);
};

const listOrders = (limit = 50) =>
  getDb()
    .prepare('SELECT * FROM orders ORDER BY created_at DESC LIMIT ?')
    .all(limit);

const listOrdersForUser = (userId, limit = 100) =>
  getDb()
    .prepare(
      `SELECT id, payment_intent_id, amount_cents, currency, provider, status, entitlements_changed, fulfilled_at, created_at
       FROM orders
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT ?`
    )
    .all(userId, limit);

const listOrdersPaged = ({ page = 1, pageSize = 20, search = '' } = {}) => {
  const db = getDb();
  const safePage = Math.max(1, Number(page) || 1);
  const safePageSize = Math.max(1, Math.min(100, Number(pageSize) || 20));
  const offset = (safePage - 1) * safePageSize;

  const where = [];
  const params = [];
  if (search && String(search).trim()) {
    where.push('(payment_intent_id LIKE ? OR provider LIKE ? OR currency LIKE ?)');
    const term = `%${String(search).trim()}%`;
    params.push(term, term, term);
  }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const rows = db
    .prepare(
      `SELECT *
       FROM orders
       ${whereSql}
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`
    )
    .all(...params, safePageSize, offset);

  const total = db
    .prepare(`SELECT COUNT(*) as count FROM orders ${whereSql}`)
    .get(...params).count;

  return {
    rows,
    meta: {
      page: safePage,
      pageSize: safePageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / safePageSize)),
    },
  };
};

const getOrderMetrics = () => {
  const row = getDb()
    .prepare(
      `SELECT
         COUNT(*) as totalOrders,
         COALESCE(SUM(amount_cents), 0) as grossRevenueCents,
         COALESCE(SUM(CASE WHEN entitlements_changed = 1 THEN 1 ELSE 0 END), 0) as membershipOrders
       FROM orders`
    )
    .get();

  return {
    totalOrders: row.totalOrders,
    grossRevenueCents: row.grossRevenueCents,
    membershipOrders: row.membershipOrders,
  };
};

module.exports = {
  findByPaymentIntentId,
  findByPaymentIntentIdForUser,
  createFulfilledOrder,
  listOrders,
  listOrdersForUser,
  listOrdersPaged,
  getOrderMetrics,
};
