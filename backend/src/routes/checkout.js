'use strict';

const { Router } = require('express');
const { requireAuth } = require('../middleware/authMiddleware');
const checkoutCtrl = require('../controllers/checkout');

const router = Router();

router.post('/webhook', checkoutCtrl.handleWebhook);
router.post('/intent', requireAuth, checkoutCtrl.createCheckoutIntent);

module.exports = router;
