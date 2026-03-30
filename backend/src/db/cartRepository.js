'use strict';

const { getDb } = require('./database');

/**
 * Get all cart items for a user, parsed with metadata.
 */
const getCartForUser = (userId) => {
  const rows = getDb()
    .prepare('SELECT * FROM cart_items WHERE user_id = ? ORDER BY created_at ASC')
    .all(userId);
  return rows.map(parseMetadata);
};

const getCartItem = (userId, itemType, itemId) => {
  const row = getDb()
    .prepare('SELECT * FROM cart_items WHERE user_id = ? AND item_type = ? AND item_id = ?')
    .get(userId, itemType, itemId);
  return row ? parseMetadata(row) : undefined;
};

/**
 * Add or update a cart item.
 * If the (user_id, item_type, item_id) combination already exists the quantity
 * is incremented by `quantity`; otherwise a new row is inserted.
 * `unit_price` is ALWAYS the server-resolved price passed in (never trusted
 * from the client).
 */
const upsertItem = ({ userId, itemType, itemId, quantity, unitPrice, metadata = {} }) => {
  const db = getDb();
  const existing = db
    .prepare('SELECT * FROM cart_items WHERE user_id = ? AND item_type = ? AND item_id = ?')
    .get(userId, itemType, itemId);

  if (existing) {
    db.prepare('UPDATE cart_items SET quantity = quantity + ?, unit_price = ? WHERE id = ?')
      .run(quantity, unitPrice, existing.id);
  } else {
    db.prepare(
      `INSERT INTO cart_items (user_id, item_type, item_id, quantity, unit_price, metadata)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run(userId, itemType, itemId, quantity, unitPrice, JSON.stringify(metadata));
  }

  return getCartForUser(userId);
};

/**
 * Remove a single cart item by its row id (must belong to the given user).
 */
const removeItem = (userId, cartItemId) => {
  getDb()
    .prepare('DELETE FROM cart_items WHERE id = ? AND user_id = ?')
    .run(cartItemId, userId);
  return getCartForUser(userId);
};

/**
 * Clear all items from a user's cart (e.g. after checkout).
 */
const clearCart = (userId) => {
  getDb().prepare('DELETE FROM cart_items WHERE user_id = ?').run(userId);
};

const parseMetadata = (row) => ({
  ...row,
  metadata: JSON.parse(row.metadata || '{}'),
});

module.exports = { getCartForUser, getCartItem, upsertItem, removeItem, clearCart };
