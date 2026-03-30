'use strict';

const { Router } = require('express');
const contactCtrl = require('../controllers/contact');

const router = Router();

router.post('/message', contactCtrl.submitContactMessage);
router.post('/subscribe', contactCtrl.subscribeNewsletter);

module.exports = router;
