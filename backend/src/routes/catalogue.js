'use strict';

const { Router } = require('express');
const catalogueCtrl = require('../controllers/catalogue');

const router = Router();

// Public catalogue endpoints — no auth required
router.get('/tickets',        catalogueCtrl.getTicketTypes);
router.get('/memberships',    catalogueCtrl.getMembershipTiers);
router.get('/products',       catalogueCtrl.getProducts);
router.get('/products/:id',   catalogueCtrl.getProduct);

module.exports = router;
