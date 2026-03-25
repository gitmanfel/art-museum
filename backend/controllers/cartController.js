const db = require('../db');

// Get all items in the user's cart
exports.getCart = async (req, res) => {
  const userId = req.user.id; // from authenticateToken middleware
  try {
    const query = `
      SELECT ci.id as cart_item_id, ci.quantity, p.id as product_id, p.name, p.price, p.image_url
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      WHERE ci.user_id = $1
    `;
    const result = await db.query(query, [userId]);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching cart:', error);
    res.status(500).json({ message: 'Server error fetching cart' });
  }
};

// Add an item to the cart or update quantity if it already exists
exports.addToCart = async (req, res) => {
  const userId = req.user.id;
  const { productId, quantity } = req.body;

  if (!productId || !quantity || quantity < 1) {
    return res.status(400).json({ message: 'Valid productId and quantity are required' });
  }

  try {
    const query = `
      INSERT INTO cart_items (user_id, product_id, quantity)
      VALUES ($1, $2, $3)
      ON CONFLICT (user_id, product_id)
      DO UPDATE SET quantity = cart_items.quantity + EXCLUDED.quantity
      RETURNING *;
    `;
    const result = await db.query(query, [userId, productId, quantity]);
    res.status(200).json({ message: 'Item added to cart', cartItem: result.rows[0] });
  } catch (error) {
    console.error('Error adding to cart:', error);
    res.status(500).json({ message: 'Server error adding to cart' });
  }
};

// Remove an item from the cart
exports.removeFromCart = async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params; // this is the cart_item_id

  try {
    const query = 'DELETE FROM cart_items WHERE id = $1 AND user_id = $2 RETURNING *';
    const result = await db.query(query, [id, userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Cart item not found or unauthorized' });
    }

    res.status(200).json({ message: 'Item removed from cart' });
  } catch (error) {
    console.error('Error removing from cart:', error);
    res.status(500).json({ message: 'Server error removing from cart' });
  }
};
