'use strict';

const { getDb } = require('./database');

const findByPaymentIntentId = (paymentIntentId) =>
  getDb()
    .prepare('SELECT * FROM orders WHERE payment_intent_id = ?')
    .get(paymentIntentId);

const createFulfilledOrder = ({ userId, paymentIntentId, amountCents, currency, provider }) => {
  getDb()
    .prepare(
      `INSERT INTO orders (user_id, payment_intent_id, amount_cents, currency, provider, status, fulfilled_at)
       VALUES (?, ?, ?, ?, ?, 'paid', unixepoch())`
    )
    .run(userId, paymentIntentId, amountCents, currency, provider);

  return findByPaymentIntentId(paymentIntentId);
};

module.exports = {
  findByPaymentIntentId,
  createFulfilledOrder,
};
