'use strict';

const { Router } = require('express');
const { requireAuth } = require('../middleware/authMiddleware');
const cartCtrl = require('../controllers/cart');

const router = Router();

// All cart endpoints require authentication
router.use(requireAuth);

router.get('/',        cartCtrl.getCart);
router.post('/',       cartCtrl.addItem);
router.delete('/:id',  cartCtrl.removeItem);
router.delete('/',     cartCtrl.clearCart);

module.exports = router;
