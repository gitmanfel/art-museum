const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const authRoutes      = require('./routes/auth');
const catalogueRoutes = require('./routes/catalogue');
const cartRoutes      = require('./routes/cart');

const app = express();

app.use(helmet());
app.use(cors({ origin: '*', optionsSuccessStatus: 200 }));
app.use(express.json());

app.use('/api/auth',      authRoutes);
app.use('/api/catalogue', catalogueRoutes);
app.use('/api/cart',      cartRoutes);

app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'Backend is running securely.' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

module.exports = app;
