const express = require('express');
const router = express.Router();
const shopController = require('../controllers/shopController');

router.get('/products', shopController.getAllProducts);
router.get('/products/:id', shopController.getProductById);

module.exports = router;
