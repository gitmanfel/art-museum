const db = require('../db');

// Get all ticket types and prices
exports.getTicketTypes = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM ticket_types ORDER BY price DESC');
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching ticket types:', error);
    res.status(500).json({ message: 'Server error fetching ticket types' });
  }
};

// Book tickets securely (Calculate total on the backend)
exports.bookTickets = async (req, res) => {
  const userId = req.user.id;
  const { date, tickets } = req.body;
  // tickets expected format: [{ ticket_type_id: 1, quantity: 2 }, ...]

  if (!date || !tickets || tickets.length === 0) {
    return res.status(400).json({ message: 'Visit date and ticket selections are required' });
  }

  const client = await db.connect();

  try {
    await client.query('BEGIN'); // Start transaction on dedicated client

    const bookings = [];
    let grandTotal = 0;

    for (const ticket of tickets) {
      if (ticket.quantity > 0) {
        // Fetch the real price from DB to prevent client tampering
        const typeResult = await client.query('SELECT price FROM ticket_types WHERE id = $1', [ticket.ticket_type_id]);

        if (typeResult.rows.length === 0) {
          throw new Error(`Invalid ticket type ID: ${ticket.ticket_type_id}`);
        }

        const price = typeResult.rows[0].price;
        const totalPrice = price * ticket.quantity;
        grandTotal += totalPrice;

        const insertQuery = `
          INSERT INTO ticket_bookings (user_id, ticket_type_id, quantity, visit_date, total_price)
          VALUES ($1, $2, $3, $4, $5)
          RETURNING *;
        `;
        const result = await client.query(insertQuery, [userId, ticket.ticket_type_id, ticket.quantity, date, totalPrice]);
        bookings.push(result.rows[0]);
      }
    }

    await client.query('COMMIT'); // Commit transaction

    res.status(201).json({
      message: 'Tickets booked successfully',
      grandTotal,
      bookings
    });
  } catch (error) {
    await client.query('ROLLBACK'); // Rollback if any error occurs
    console.error('Error booking tickets:', error);
    res.status(500).json({ message: error.message || 'Server error booking tickets' });
  } finally {
    client.release(); // Always release the client back to the pool
  }
};

// Get user's bookings
exports.getMyBookings = async (req, res) => {
  const userId = req.user.id;

  try {
    const query = `
      SELECT tb.id, tb.visit_date, tb.quantity, tb.total_price, tt.name as ticket_name
      FROM ticket_bookings tb
      JOIN ticket_types tt ON tb.ticket_type_id = tt.id
      WHERE tb.user_id = $1
      ORDER BY tb.visit_date ASC;
    `;
    const result = await db.query(query, [userId]);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ message: 'Server error fetching bookings' });
  }
};
