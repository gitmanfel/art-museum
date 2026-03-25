const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const authenticateToken = require('../middleware/auth');

router.post('/create-payment-intent', authenticateToken, paymentController.createPaymentIntent);

// Webhook requires raw body parsing, so it's handled specifically in server.js
// router.post('/webhook', express.raw({type: 'application/json'}), paymentController.handleWebhook);

module.exports = router;
