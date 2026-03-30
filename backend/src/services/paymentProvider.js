'use strict';

const PROVIDER_STRIPE = 'stripe';
const PROVIDER_MOCK   = 'mock';

const isProduction = () => process.env.NODE_ENV === 'production';
const stripeSecret = () => process.env.STRIPE_SECRET_KEY || '';

let stripeClient;
const getStripeClient = () => {
  if (!stripeClient) {
    const Stripe = require('stripe');
    stripeClient = new Stripe(stripeSecret());
  }
  return stripeClient;
};

const randomSuffix = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

const createPaymentIntent = async ({ amountCents, currency, metadata, idempotencyKey }) => {
  if (!Number.isInteger(amountCents) || amountCents <= 0) {
    throw new Error('Invalid amount for payment intent');
  }

  const secret = stripeSecret();
  if (!secret) {
    if (isProduction()) {
      const err = new Error('Stripe is not configured in production');
      err.code = 'stripe_not_configured';
      throw err;
    }

    // Safe local/dev fallback so checkout flow can be tested without live Stripe keys.
    return {
      provider: PROVIDER_MOCK,
      id: `pi_mock_${randomSuffix()}`,
      clientSecret: `pi_mock_secret_${randomSuffix()}`,
      amount: amountCents,
      currency,
      status: 'requires_payment_method',
    };
  }

  const intent = await getStripeClient().paymentIntents.create(
    {
      amount: amountCents,
      currency,
      automatic_payment_methods: { enabled: true },
      metadata,
    },
    idempotencyKey ? { idempotencyKey } : undefined
  );

  return {
    provider: PROVIDER_STRIPE,
    id: intent.id,
    clientSecret: intent.client_secret,
    amount: intent.amount,
    currency: intent.currency,
    status: intent.status,
  };
};

module.exports = {
  createPaymentIntent,
  PROVIDER_MOCK,
  PROVIDER_STRIPE,
};
