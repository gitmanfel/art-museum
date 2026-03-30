'use strict';

const cartRepo = require('../db/cartRepository');
const catalogueRepo = require('../db/catalogueRepository');
const orderRepo = require('../db/orderRepository');
const userRepo = require('../db/userRepository');
const { recordCheckoutAttempt } = require('../services/monitoring');
const { createPaymentIntent, constructWebhookEvent, PROVIDER_STRIPE, PROVIDER_MOCK } = require('../services/paymentProvider');

const calcCartTotal = (items) =>
  items.reduce((sum, i) => sum + i.unit_price * i.quantity, 0);

const fulfillPaymentIntent = ({ intent, provider }) => {
  const userId = intent?.metadata?.userId;
  const paymentIntentId = intent?.id;

  if (!userId || !paymentIntentId) {
    const error = new Error('Missing required payment metadata');
    error.code = 'missing_payment_metadata';
    throw error;
  }

  const existing = orderRepo.findByPaymentIntentId(paymentIntentId);
  if (existing) {
    const user = userRepo.findById(userId);
    return {
      fulfilled: true,
      duplicate: true,
      entitlementsChanged: Boolean(existing.entitlements_changed),
      userRole: user?.role || 'user',
    };
  }

  let entitlementsChanged = false;
  if (intent?.metadata?.hasMembership === '1') {
    const user = userRepo.findById(userId);
    if (user && user.role === 'user') {
      userRepo.updateRole(userId, 'member');
      entitlementsChanged = true;
    }
  }

  const updatedUser = userRepo.findById(userId);

  orderRepo.createFulfilledOrder({
    userId,
    paymentIntentId,
    amountCents: intent.amount_received || intent.amount || 0,
    currency: intent.currency || 'usd',
    provider,
    entitlementsChanged,
  });

  const purchasedItems = cartRepo.getCartForUser(userId);
  purchasedItems
    .filter((item) => item.item_type === 'product')
    .forEach((item) => {
      catalogueRepo.decrementProductStock({
        id: item.item_id,
        quantity: item.quantity,
      });
    });

  catalogueRepo.clearReservationsForUser(userId);

  // Cart is only cleared after confirmed payment success.
  cartRepo.clearCart(userId);

  return {
    fulfilled: true,
    duplicate: false,
    entitlementsChanged,
    userRole: updatedUser?.role || 'user',
  };
};

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
  const hasMembership = items.some(i => i.item_type === 'membership');

  const reservation = catalogueRepo.reserveInventoryForCheckout({
    userId: req.user.userId,
    items,
    ttlSeconds: 900,
  });

  if (!reservation.ok) {
    recordCheckoutAttempt(false);
    return res.status(409).json({
      error: 'Inventory reservation failed',
      reason: reservation.reason,
      itemId: reservation.itemId,
      availableStock: reservation.availableStock,
    });
  }

  try {
    const intent = await createPaymentIntent({
      amountCents,
      currency,
      idempotencyKey,
      metadata: {
        userId: req.user.userId,
        email: req.user.email,
        itemCount: String(items.length),
        hasMembership: hasMembership ? '1' : '0',
      },
    });

    let fulfillment = {
      fulfilled: false,
      duplicate: false,
      entitlementsChanged: false,
      userRole: req.user.role,
    };

    if (intent.provider === PROVIDER_MOCK) {
      fulfillment = fulfillPaymentIntent({
        provider: PROVIDER_MOCK,
        intent: {
          id: intent.id,
          amount: intent.amount,
          amount_received: intent.amount,
          currency: intent.currency,
          metadata: {
            userId: req.user.userId,
            email: req.user.email,
            itemCount: String(items.length),
            hasMembership: hasMembership ? '1' : '0',
          },
        },
      });
    }

    recordCheckoutAttempt(true);

    return res.status(200).json({
      provider: intent.provider,
      paymentIntentId: intent.id,
      clientSecret: intent.clientSecret,
      amountCents: intent.amount,
      currency: intent.currency,
      status: intent.status,
      reservationExpiresAt: reservation.expiresAt,
      cartTotal: total,
      fulfilled: fulfillment.fulfilled,
      entitlementsChanged: fulfillment.entitlementsChanged,
      userRole: fulfillment.userRole,
    });
  } catch (error) {
    catalogueRepo.clearReservationsForUser(req.user.userId);
    recordCheckoutAttempt(false);
    if (error.code === 'stripe_not_configured') {
      return res.status(503).json({ error: 'Payment provider is unavailable' });
    }
    return res.status(502).json({ error: 'Could not create payment intent' });
  }
};

exports.getCheckoutStatus = (req, res) => {
  const order = orderRepo.findByPaymentIntentIdForUser(req.params.paymentIntentId, req.user.userId);
  if (!order) {
    return res.status(200).json({
      fulfilled: false,
      entitlementsChanged: false,
      userRole: req.user.role,
    });
  }

  return res.status(200).json({
    fulfilled: order.status === 'paid',
    entitlementsChanged: Boolean(order.entitlements_changed),
    userRole: req.user.role,
  });
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

  try {
    const fulfillment = fulfillPaymentIntent({
      intent: event.data?.object,
      provider: signature ? PROVIDER_STRIPE : PROVIDER_MOCK,
    });
    recordCheckoutAttempt(true);
    return res.status(200).json({ received: true, ...fulfillment });
  } catch (error) {
    recordCheckoutAttempt(false);
    if (error.code === 'missing_payment_metadata') {
      return res.status(400).json({ error: 'Missing required payment metadata' });
    }
    return res.status(400).json({ error: 'Could not fulfill payment' });
  }
};
