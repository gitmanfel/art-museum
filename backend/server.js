const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Basic Route for testing
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'success', message: 'Backend is running' });
});

// Epic 1: Identity & Access Management Routes
const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);

// Protected Route Example using auth middleware
const authenticateToken = require('./middleware/auth');
app.get('/api/protected', authenticateToken, (req, res) => {
  res.status(200).json({ message: `Access granted to protected route for user ID: ${req.user.id}` });
});

// Epic 2/3: Exhibitions, Discovery & Collections Routes
const exhibitionRoutes = require('./routes/exhibitionRoutes');
app.use('/api/exhibitions', exhibitionRoutes);

// Epic 4: E-Commerce / Shop & Cart
const shopRoutes = require('./routes/shopRoutes');
const cartRoutes = require('./routes/cartRoutes');
app.use('/api/shop', shopRoutes);
app.use('/api/cart', cartRoutes);

// Epic 5: Ticketing & Booking
const ticketRoutes = require('./routes/ticketRoutes');
app.use('/api/tickets', ticketRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
