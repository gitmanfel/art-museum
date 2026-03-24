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

// Epic 1: Identity & Access Management Routes (Placeholders)
app.post('/api/auth/login', (req, res) => {
  res.status(200).json({ message: 'Login endpoint' });
});

app.post('/api/auth/register', (req, res) => {
  res.status(200).json({ message: 'Register endpoint' });
});

// Epic 2: Main Navigation & Discovery Routes (Placeholders)
app.get('/api/exhibitions/featured', (req, res) => {
  res.status(200).json({ message: 'Featured exhibitions endpoint' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
