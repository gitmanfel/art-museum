'use strict';

const { Router } = require('express');
const catalogueCtrl = require('../controllers/catalogue');
const { requireAuth, requireAdmin } = require('../middleware/authMiddleware');

const router = Router();

// Public catalogue endpoints — no auth required
router.get('/tickets',        catalogueCtrl.getTicketTypes);
router.get('/memberships',    catalogueCtrl.getMembershipTiers);
router.get('/products',       catalogueCtrl.getProducts);
router.get('/products/:id',   catalogueCtrl.getProduct);
router.get('/collections',    catalogueCtrl.getCollections);
router.get('/collections/:id', catalogueCtrl.getCollection);
router.get('/exhibitions',    catalogueCtrl.getExhibitions);
router.get('/exhibitions/:id', catalogueCtrl.getExhibition);
router.patch('/products/:id/inventory', requireAuth, requireAdmin, catalogueCtrl.updateProductInventory);

module.exports = router;
