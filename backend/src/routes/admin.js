'use strict';

const { Router } = require('express');
const { requireAuth, requireAdmin } = require('../middleware/authMiddleware');
const adminCtrl = require('../controllers/admin');

const router = Router();

router.use(requireAuth, requireAdmin);

router.get('/overview', adminCtrl.getOverview);
router.get('/orders', adminCtrl.getOrders);
router.get('/users', adminCtrl.getUsers);
router.get('/audit-logs', adminCtrl.getAuditLogs);
router.get('/contact-messages', adminCtrl.getContactMessages);
router.get('/newsletter-subscribers', adminCtrl.getNewsletterSubscribers);
router.post('/contact-messages/:id/reply', adminCtrl.replyToContactMessage);
router.post('/collections', adminCtrl.createCollection);
router.patch('/collections/:id', adminCtrl.updateCollection);
router.delete('/collections/:id', adminCtrl.deleteCollection);
router.post('/exhibitions', adminCtrl.createExhibition);
router.patch('/exhibitions/:id', adminCtrl.updateExhibition);
router.delete('/exhibitions/:id', adminCtrl.deleteExhibition);

module.exports = router;
