'use strict';

const catalogueRepo = require('../db/catalogueRepository');
const cartRepo      = require('../db/cartRepository');

const calcCartTotal = (items) =>
  items.reduce((sum, i) => sum + i.unit_price * i.quantity, 0);

/**
 * GET /api/cart
 * Returns the authenticated user's cart with per-item and total prices.
 */
exports.getCart = (req, res) => {
  const items = cartRepo.getCartForUser(req.user.userId);
  return res.status(200).json({ items, total: calcCartTotal(items) });
};

/**
 * POST /api/cart
 * Body: { itemType: 'product'|'ticket'|'membership', itemId, quantity }
 * Resolves server-side price; never trusts client-supplied price.
 */
exports.addItem = (req, res) => {
  const { itemType, itemId, quantity = 1 } = req.body;

  if (!itemType || !itemId) {
    return res.status(400).json({ error: 'itemType and itemId are required' });
  }

  const qty = Math.max(1, Math.floor(Number(quantity)));
  if (!Number.isFinite(qty)) {
    return res.status(400).json({ error: 'quantity must be a positive integer' });
  }

  let unitPrice;
  let metadata = {};

  if (itemType === 'product') {
    const product = catalogueRepo.getProductById(itemId);
    if (!product) return res.status(404).json({ error: 'Product not found' });

    const existingItem = cartRepo.getCartItem(req.user.userId, 'product', itemId);
    const existingQty = existingItem ? existingItem.quantity : 0;
    const requestedQty = existingQty + qty;
    if (requestedQty > Number(product.stock_quantity || 0)) {
      return res.status(409).json({
        error: 'Requested quantity exceeds available stock',
        availableStock: Number(product.stock_quantity || 0),
      });
    }

    // Apply member price if user has admin or member role; extend when
    // dedicated membership RBAC is implemented.
    const isMember = req.user.role === 'admin' || req.user.role === 'member';
    unitPrice = isMember && product.member_price != null
      ? product.member_price
      : product.price;
    metadata = { name: product.name };

  } else if (itemType === 'ticket') {
    const ticket = catalogueRepo.getTicketTypeById(itemId);
    if (!ticket) return res.status(404).json({ error: 'Ticket type not found' });
    unitPrice = ticket.price;
    metadata = { name: ticket.name };

  } else if (itemType === 'membership') {
    const tier = catalogueRepo.getMembershipTierById(itemId);
    if (!tier) return res.status(404).json({ error: 'Membership tier not found' });
    unitPrice = tier.price;
    metadata = { name: tier.name };

  } else {
    return res.status(400).json({ error: 'itemType must be product, ticket, or membership' });
  }

  const items = cartRepo.upsertItem({
    userId: req.user.userId,
    itemType,
    itemId,
    quantity: qty,
    unitPrice,
    metadata,
  });

  return res.status(200).json({ items, total: calcCartTotal(items) });
};

/**
 * DELETE /api/cart/:id
 * Removes a specific cart item by its row id.
 */
exports.removeItem = (req, res) => {
  const cartItemId = Number(req.params.id);
  if (!Number.isFinite(cartItemId)) {
    return res.status(400).json({ error: 'Invalid cart item id' });
  }
  const items = cartRepo.removeItem(req.user.userId, cartItemId);
  return res.status(200).json({ items, total: calcCartTotal(items) });
};

/**
 * DELETE /api/cart
 * Clears the entire cart.
 */
exports.clearCart = (req, res) => {
  cartRepo.clearCart(req.user.userId);
  return res.status(200).json({ items: [], total: 0 });
};
