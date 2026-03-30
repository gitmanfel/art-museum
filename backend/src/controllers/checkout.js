'use strict';

const cartRepo = require('../db/cartRepository');
const orderRepo = require('../db/orderRepository');
const { createPaymentIntent, constructWebhookEvent, PROVIDER_STRIPE, PROVIDER_MOCK } = require('../services/paymentProvider');

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

exports.handleWebhook = (req, res) => {
  const signature = req.headers['stripe-signature'];
  let event;

  try {
    event = constructWebhookEvent({ rawBody: req.body, signature });
  } catch (error) {
    if (error.code === 'webhook_not_configured') {
      return res.status(503).json({ error: 'Payment webhook provider is unavailable' });
    }
    if (error.code === 'invalid_webhook_signature' || error.code === 'invalid_webhook_payload') {
      return res.status(400).json({ error: 'Invalid webhook event' });
    }
    return res.status(400).json({ error: 'Could not parse webhook event' });
  }

  if (event.type !== 'payment_intent.succeeded') {
    return res.status(200).json({ received: true, ignored: true });
  }

  const intent = event.data?.object;
  const userId = intent?.metadata?.userId;
  const paymentIntentId = intent?.id;

  if (!userId || !paymentIntentId) {
    return res.status(400).json({ error: 'Missing required payment metadata' });
  }

  const existing = orderRepo.findByPaymentIntentId(paymentIntentId);
  if (existing) {
    return res.status(200).json({ received: true, duplicate: true });
  }

  orderRepo.createFulfilledOrder({
    userId,
    paymentIntentId,
    amountCents: intent.amount_received || intent.amount || 0,
    currency: intent.currency || 'usd',
    provider: signature ? PROVIDER_STRIPE : PROVIDER_MOCK,
  });

  // Cart is only cleared after confirmed payment success.
  cartRepo.clearCart(userId);

  return res.status(200).json({ received: true, fulfilled: true });
};
