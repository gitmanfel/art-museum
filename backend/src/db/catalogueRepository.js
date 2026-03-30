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

const updateProductStock = (id, stockQuantity) => {
  const db = getDb();
  db.prepare('UPDATE products SET stock_quantity = ? WHERE id = ?').run(stockQuantity, id);
  return getProductById(id);
};

const decrementProductStock = ({ id, quantity }) => {
  const db = getDb();
  const product = db.prepare('SELECT stock_quantity FROM products WHERE id = ?').get(id);
  if (!product) return { ok: false, reason: 'not_found' };
  if (product.stock_quantity < quantity) return { ok: false, reason: 'insufficient_stock' };

  db.prepare('UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?')
    .run(quantity, id);
  return { ok: true };
};

const getLowStockProducts = (threshold = 5) => {
  return getDb()
    .prepare(
      `SELECT id, name, category, stock_quantity
       FROM products
       WHERE stock_quantity <= ?
       ORDER BY stock_quantity ASC, name ASC`
    )
    .all(threshold);
};

const parseProductImages = (row) => ({
  ...row,
  images: JSON.parse(row.images || '[]'),
});

// ---------- Exhibitions ----------

/**
 * Get all exhibitions with optional filtering.
 * @param {Object} filters - Optional filters { search, artist, start_date, end_date }
 * @returns {Array} Exhibition records
 */
const getExhibitions = (filters = {}) => {
  const db = getDb();
  let sql = 'SELECT * FROM exhibitions WHERE 1=1';
  const params = [];

  if (filters.search) {
    sql += ' AND (name LIKE ? OR artist LIKE ? OR description LIKE ?)';
    const searchTerm = `%${filters.search}%`;
    params.push(searchTerm, searchTerm, searchTerm);
  }

  if (filters.artist) {
    sql += ' AND artist LIKE ?';
    params.push(`%${filters.artist}%`);
  }

  if (filters.start_date) {
    sql += ' AND start_date >= ?';
    params.push(filters.start_date);
  }

  if (filters.end_date) {
    sql += ' AND end_date <= ?';
    params.push(filters.end_date);
  }

  sql += ' ORDER BY start_date DESC, name ASC';
  const exhibitions = db.prepare(sql).all(...params);
  const artworksStmt = db.prepare(
    'SELECT * FROM artworks WHERE exhibition_id = ? ORDER BY year DESC, title ASC'
  );
  return exhibitions.map((exhibition) => ({
    ...exhibition,
    artworks: artworksStmt.all(exhibition.id),
  }));
};

/**
 * Get a single exhibition with all its artworks.
 * @param {string} id - Exhibition ID
 * @returns {Object} Exhibition with artworks array
 */
const getExhibitionById = (id) => {
  const db = getDb();
  const exhibition = db.prepare('SELECT * FROM exhibitions WHERE id = ?').get(id);
  if (!exhibition) return undefined;

  const artworks = db.prepare(
    'SELECT * FROM artworks WHERE exhibition_id = ? ORDER BY year DESC, title ASC'
  ).all(id);

  return { ...exhibition, artworks };
};

const createExhibition = ({ id, name, artist = null, description = null, start_date = null, end_date = null, location_floor = null, image_url = null }) => {
  const db = getDb();
  db.prepare(
    `INSERT INTO exhibitions (id, name, artist, description, start_date, end_date, location_floor, image_url)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(id, name, artist, description, start_date, end_date, location_floor, image_url);
  return getExhibitionById(id);
};

const updateExhibition = (id, fields) => {
  const db = getDb();
  db.prepare(
    `UPDATE exhibitions
       SET name = ?, artist = ?, description = ?, start_date = ?, end_date = ?, location_floor = ?, image_url = ?
     WHERE id = ?`
  ).run(
    fields.name,
    fields.artist,
    fields.description,
    fields.start_date,
    fields.end_date,
    fields.location_floor,
    fields.image_url,
    id
  );
  return getExhibitionById(id);
};

// ---------- Collections ----------

/**
 * Get all collections with optional filtering.
 * @param {Object} filters - Optional filters { category, era_start, era_end, search }
 * @returns {Array} Collection records
 */
const getCollections = (filters = {}) => {
  const db = getDb();
  let sql = 'SELECT * FROM collections WHERE 1=1';
  const params = [];

  if (filters.search) {
    sql += ' AND (name LIKE ? OR description LIKE ?)';
    const searchTerm = `%${filters.search}%`;
    params.push(searchTerm, searchTerm);
  }

  if (filters.category) {
    sql += ' AND category = ?';
    params.push(filters.category);
  }

  if (filters.era_start !== undefined) {
    sql += ' AND era_start >= ?';
    params.push(filters.era_start);
  }

  if (filters.era_end !== undefined) {
    sql += ' AND era_end <= ?';
    params.push(filters.era_end);
  }

  sql += ' ORDER BY name ASC';
  return db.prepare(sql).all(...params);
};

/**
 * Get a single collection with all its artworks.
 * @param {string} id - Collection ID
 * @returns {Object} Collection with artworks array
 */
const getCollectionById = (id) => {
  const db = getDb();
  const collection = db.prepare('SELECT * FROM collections WHERE id = ?').get(id);
  if (!collection) return undefined;

  const artworks = db.prepare(`
    SELECT a.* FROM artworks a
    JOIN collection_artworks ca ON a.id = ca.artwork_id
    WHERE ca.collection_id = ?
    ORDER BY a.title ASC
  `).all(id);

  return { ...collection, artworks };
};

const createCollection = ({ id, name, description = null, category = null, era_start = null, era_end = null, image_url = null }) => {
  const db = getDb();
  db.prepare(
    `INSERT INTO collections (id, name, description, category, era_start, era_end, image_url)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(id, name, description, category, era_start, era_end, image_url);
  return getCollectionById(id);
};

const updateCollection = (id, fields) => {
  const db = getDb();
  db.prepare(
    `UPDATE collections
       SET name = ?, description = ?, category = ?, era_start = ?, era_end = ?, image_url = ?
     WHERE id = ?`
  ).run(
    fields.name,
    fields.description,
    fields.category,
    fields.era_start,
    fields.era_end,
    fields.image_url,
    id
  );
  return getCollectionById(id);
};

module.exports = {
  getAllTicketTypes,
  getTicketTypeById,
  getAllMembershipTiers,
  getMembershipTierById,
  getAllProducts,
  getProductById,
  updateProductStock,
  decrementProductStock,
  getLowStockProducts,
  getExhibitions,
  getExhibitionById,
  createExhibition,
  updateExhibition,
  getCollections,
  getCollectionById,
  createCollection,
  updateCollection,
};
