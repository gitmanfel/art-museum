'use strict';

const { Router } = require('express');
const { requireAuth } = require('../middleware/authMiddleware');
const checkoutCtrl = require('../controllers/checkout');

const router = Router();

router.post('/webhook', checkoutCtrl.handleWebhook);
router.post('/intent', requireAuth, checkoutCtrl.createCheckoutIntent);
router.get('/orders', requireAuth, checkoutCtrl.getMyOrders);
router.get('/status/:paymentIntentId', requireAuth, checkoutCtrl.getCheckoutStatus);

module.exports = router;
