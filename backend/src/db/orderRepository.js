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
  getOrderMetrics,
};
