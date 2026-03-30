const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const authRoutes      = require('./routes/auth');
const catalogueRoutes = require('./routes/catalogue');
const cartRoutes      = require('./routes/cart');
const checkoutRoutes  = require('./routes/checkout');
const adminRoutes     = require('./routes/admin');
const { getMetrics } = require('./services/monitoring');

const app = express();

app.use(helmet());
app.use(cors({ origin: '*', optionsSuccessStatus: 200 }));

// Stripe webhook verification requires raw request body, so mount this before JSON parsing.
app.use('/api/checkout/webhook', express.raw({ type: 'application/json' }));
app.use(express.json());

app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const durationMs = Date.now() - start;
    console.info(
      JSON.stringify({
        level: 'info',
        event: 'http_request',
        method: req.method,
        path: req.originalUrl,
        statusCode: res.statusCode,
        durationMs,
      })
    );
  });
  next();
});

app.use('/api/auth',      authRoutes);
app.use('/api/catalogue', catalogueRoutes);
app.use('/api/cart',      cartRoutes);
app.use('/api/checkout',  checkoutRoutes);
app.use('/api/admin',     adminRoutes);

app.get('/api/health', (req, res) => {
    res.status(200).json({
      status: 'ok',
      message: 'Backend is running securely.',
      metrics: getMetrics(),
    });
});

app.use((err, req, res, next) => {
  console.error(
    JSON.stringify({
      level: 'error',
      event: 'unhandled_exception',
      message: err.message,
      stack: err.stack,
      path: req.originalUrl,
      method: req.method,
    })
  );
  res.status(500).json({ error: 'Internal Server Error' });
});

module.exports = app;
