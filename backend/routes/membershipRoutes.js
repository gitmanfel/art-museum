const express = require('express');
const router = express.Router();
const membershipController = require('../controllers/membershipController');
const authenticateToken = require('../middleware/auth');

router.get('/tiers', membershipController.getMembershipTiers);
router.post('/purchase', authenticateToken, membershipController.purchaseMembership);

module.exports = router;
