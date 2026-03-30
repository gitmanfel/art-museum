'use strict';

const { Router } = require('express');
const { requireAuth, requireAdmin } = require('../middleware/authMiddleware');
const adminCtrl = require('../controllers/admin');

const router = Router();

router.use(requireAuth, requireAdmin);

router.get('/overview', adminCtrl.getOverview);
router.get('/orders', adminCtrl.getOrders);
router.get('/users', adminCtrl.getUsers);
router.post('/collections', adminCtrl.createCollection);
router.patch('/collections/:id', adminCtrl.updateCollection);
router.post('/exhibitions', adminCtrl.createExhibition);
router.patch('/exhibitions/:id', adminCtrl.updateExhibition);

module.exports = router;
