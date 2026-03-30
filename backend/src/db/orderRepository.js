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

module.exports = {
  findByPaymentIntentId,
  findByPaymentIntentIdForUser,
  createFulfilledOrder,
};
