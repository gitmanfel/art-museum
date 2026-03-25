const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Create a Payment Intent
exports.createPaymentIntent = async (req, res) => {
  const { amount, currency } = req.body;
  // amount should be in cents (e.g., $10.00 = 1000)

  if (!amount || amount <= 0) {
    return res.status(400).json({ message: 'Valid amount is required' });
  }

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // convert to cents
      currency: currency || 'usd',
      automatic_payment_methods: {
        enabled: true,
      },
    });

    res.status(200).json({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    console.error('Stripe error:', error.message);
    // If the Stripe key is a placeholder, it will throw an auth error
    // For development/sandbox, we handle it gracefully:
    if (error.type === 'StripeAuthenticationError') {
      console.warn("Using placeholder Stripe key! Payment Intent creation skipped.");
      return res.status(200).json({
        clientSecret: "pi_mock_secret_for_sandbox",
        message: "Stripe authentication failed (using placeholder key). Returning a mock secret for UI testing."
      });
    }
    res.status(500).json({ message: 'Internal Server Error fetching client secret' });
  }
};

// Handle Stripe Webhooks
exports.handleWebhook = (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
  let event;

  try {
    // Note: req.body MUST be raw buffer here, not JSON parsed by express.json()
    // server.js must be configured to use express.raw({type: 'application/json'}) for this route
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error('Webhook Error:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      console.log(`PaymentIntent for ${paymentIntent.amount} was successful!`);
      // TODO: Fulfill the order (clear cart, generate tickets, update membership)
      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  // Return a 200 response to acknowledge receipt of the event
  res.send();
};
