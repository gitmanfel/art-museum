const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticketController');
const authenticateToken = require('../middleware/auth');

router.get('/types', ticketController.getTicketTypes);
router.get('/my-bookings', authenticateToken, ticketController.getMyBookings);
router.post('/book', authenticateToken, ticketController.bookTickets);

module.exports = router;
