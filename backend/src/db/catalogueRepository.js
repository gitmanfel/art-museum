'use strict';

const { getDb } = require('./database');

// ---------- Ticket types ----------
const getAllTicketTypes = () =>
  getDb().prepare('SELECT * FROM ticket_types ORDER BY price ASC').all();

const getTicketTypeById = (id) =>
  getDb().prepare('SELECT * FROM ticket_types WHERE id = ?').get(id);

// ---------- Membership tiers ----------
const getAllMembershipTiers = () =>
  getDb().prepare('SELECT * FROM membership_tiers ORDER BY price ASC').all();

const getMembershipTierById = (id) =>
  getDb().prepare('SELECT * FROM membership_tiers WHERE id = ?').get(id);

// ---------- Products ----------
const getAllProducts = () => {
  const rows = getDb().prepare('SELECT * FROM products ORDER BY name ASC').all();
  return rows.map(parseProductImages);
};

const getProductById = (id) => {
  const row = getDb().prepare('SELECT * FROM products WHERE id = ?').get(id);
  return row ? parseProductImages(row) : undefined;
};

const parseProductImages = (row) => ({
  ...row,
  images: JSON.parse(row.images || '[]'),
});

module.exports = {
  getAllTicketTypes,
  getTicketTypeById,
  getAllMembershipTiers,
  getMembershipTierById,
  getAllProducts,
  getProductById,
};
