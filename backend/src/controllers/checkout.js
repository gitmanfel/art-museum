'use strict';

const cartRepo = require('../db/cartRepository');
const { createPaymentIntent } = require('../services/paymentProvider');

const calcCartTotal = (items) =>
  items.reduce((sum, i) => sum + i.unit_price * i.quantity, 0);

exports.createCheckoutIntent = async (req, res) => {
  const idempotencyKey = req.headers['idempotency-key'];
  if (!idempotencyKey) {
    return res.status(400).json({ error: 'Idempotency-Key header is required' });
  }

  const items = cartRepo.getCartForUser(req.user.userId);
  if (items.length === 0) {
    return res.status(400).json({ error: 'Cart is empty' });
  }

  const total = calcCartTotal(items);
  const amountCents = Math.round(total * 100);
  const currency = 'usd';

  try {
    const intent = await createPaymentIntent({
      amountCents,
      currency,
      idempotencyKey,
      metadata: {
        userId: req.user.userId,
        email: req.user.email,
        itemCount: String(items.length),
      },
    });

    return res.status(200).json({
      provider: intent.provider,
      paymentIntentId: intent.id,
      clientSecret: intent.clientSecret,
      amountCents: intent.amount,
      currency: intent.currency,
      status: intent.status,
      cartTotal: total,
    });
  } catch (error) {
    if (error.code === 'stripe_not_configured') {
      return res.status(503).json({ error: 'Payment provider is unavailable' });
    }
    return res.status(502).json({ error: 'Could not create payment intent' });
  }
};
