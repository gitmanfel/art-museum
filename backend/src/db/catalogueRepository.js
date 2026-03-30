'use strict';

const { getDb } = require('./database');
const { recordLowStockEvent } = require('../services/monitoring');

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

  const updated = db.prepare('SELECT stock_quantity FROM products WHERE id = ?').get(id);
  recordLowStockEvent({ productId: id, stockQuantity: Number(updated.stock_quantity || 0) });

  return { ok: true };
};

const clearExpiredReservations = () => {
  getDb()
    .prepare('DELETE FROM inventory_reservations WHERE expires_at <= unixepoch()')
    .run();
};

const clearReservationsForUser = (userId) => {
  getDb()
    .prepare('DELETE FROM inventory_reservations WHERE user_id = ?')
    .run(userId);
};

const reserveInventoryForCheckout = ({ userId, items, ttlSeconds = 900 }) => {
  const db = getDb();
  const products = items.filter((item) => item.item_type === 'product');
  if (products.length === 0) return { ok: true };

  const tx = db.transaction(() => {
    clearExpiredReservations();
    clearReservationsForUser(userId);

    for (const item of products) {
      const product = db.prepare('SELECT id, stock_quantity FROM products WHERE id = ?').get(item.item_id);
      if (!product) {
        return { ok: false, reason: 'product_not_found', itemId: item.item_id };
      }

      const reservedByOthers = db
        .prepare(
          `SELECT COALESCE(SUM(quantity), 0) as qty
           FROM inventory_reservations
           WHERE product_id = ? AND user_id != ? AND expires_at > unixepoch()`
        )
        .get(item.item_id, userId).qty;

      const available = Number(product.stock_quantity || 0) - Number(reservedByOthers || 0);
      if (item.quantity > available) {
        return {
          ok: false,
          reason: 'insufficient_stock',
          itemId: item.item_id,
          availableStock: Math.max(0, available),
        };
      }
    }

    const expiresAt = Math.floor(Date.now() / 1000) + ttlSeconds;
    const insert = db.prepare(
      'INSERT INTO inventory_reservations (user_id, product_id, quantity, expires_at) VALUES (?, ?, ?, ?)'
    );

    for (const item of products) {
      insert.run(userId, item.item_id, item.quantity, expiresAt);
    }

    return { ok: true, expiresAt };
  });

  return tx();
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
  const safePage = Math.max(1, Number(filters.page) || 1);
  const safePageSize = Math.max(1, Math.min(100, Number(filters.pageSize) || 20));
  const offset = (safePage - 1) * safePageSize;

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

  sql += ' ORDER BY start_date DESC, name ASC LIMIT ? OFFSET ?';
  const exhibitions = db.prepare(sql).all(...params, safePageSize, offset);

  const countSql = sql
    .replace(' ORDER BY start_date DESC, name ASC LIMIT ? OFFSET ?', '')
    .replace('SELECT *', 'SELECT COUNT(*) as count');
  const total = db.prepare(countSql).get(...params).count;

  const artworksStmt = db.prepare(
    'SELECT * FROM artworks WHERE exhibition_id = ? ORDER BY year DESC, title ASC'
  );
  return {
    rows: exhibitions.map((exhibition) => ({
      ...exhibition,
      artworks: artworksStmt.all(exhibition.id),
    })),
    meta: {
      page: safePage,
      pageSize: safePageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / safePageSize)),
    },
  };
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
    `INSERT INTO exhibitions (id, name, artist, description, start_date, end_date, location_floor, image_url, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, unixepoch())`
  ).run(id, name, artist, description, start_date, end_date, location_floor, image_url);
  return getExhibitionById(id);
};

const updateExhibition = (id, fields, expectedUpdatedAt) => {
  const db = getDb();
  const result = db.prepare(
    `UPDATE exhibitions
       SET name = ?, artist = ?, description = ?, start_date = ?, end_date = ?, location_floor = ?, image_url = ?, updated_at = unixepoch()
     WHERE id = ? AND updated_at = ?`
  ).run(
    fields.name,
    fields.artist,
    fields.description,
    fields.start_date,
    fields.end_date,
    fields.location_floor,
    fields.image_url,
    id,
    expectedUpdatedAt
  );
  if (result.changes === 0) return { ok: false, reason: 'conflict' };
  return getExhibitionById(id);
};

const deleteExhibition = (id) => {
  const db = getDb();
  const existing = db.prepare('SELECT id FROM exhibitions WHERE id = ?').get(id);
  if (!existing) return false;
  db.prepare('DELETE FROM exhibitions WHERE id = ?').run(id);
  return true;
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
  const safePage = Math.max(1, Number(filters.page) || 1);
  const safePageSize = Math.max(1, Math.min(100, Number(filters.pageSize) || 20));
  const offset = (safePage - 1) * safePageSize;

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

  sql += ' ORDER BY name ASC LIMIT ? OFFSET ?';
  const rows = db.prepare(sql).all(...params, safePageSize, offset);
  const countSql = sql
    .replace(' ORDER BY name ASC LIMIT ? OFFSET ?', '')
    .replace('SELECT *', 'SELECT COUNT(*) as count');
  const total = db.prepare(countSql).get(...params).count;
  return {
    rows,
    meta: {
      page: safePage,
      pageSize: safePageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / safePageSize)),
    },
  };
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
    `INSERT INTO collections (id, name, description, category, era_start, era_end, image_url, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, unixepoch())`
  ).run(id, name, description, category, era_start, era_end, image_url);
  return getCollectionById(id);
};

const updateCollection = (id, fields, expectedUpdatedAt) => {
  const db = getDb();
  const result = db.prepare(
    `UPDATE collections
       SET name = ?, description = ?, category = ?, era_start = ?, era_end = ?, image_url = ?, updated_at = unixepoch()
     WHERE id = ? AND updated_at = ?`
  ).run(
    fields.name,
    fields.description,
    fields.category,
    fields.era_start,
    fields.era_end,
    fields.image_url,
    id,
    expectedUpdatedAt
  );
  if (result.changes === 0) return { ok: false, reason: 'conflict' };
  return getCollectionById(id);
};

const deleteCollection = (id) => {
  const db = getDb();
  const existing = db.prepare('SELECT id FROM collections WHERE id = ?').get(id);
  if (!existing) return false;
  db.prepare('DELETE FROM collections WHERE id = ?').run(id);
  return true;
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
  reserveInventoryForCheckout,
  clearReservationsForUser,
  getLowStockProducts,
  getExhibitions,
  getExhibitionById,
  createExhibition,
  updateExhibition,
  deleteExhibition,
  getCollections,
  getCollectionById,
  createCollection,
  updateCollection,
  deleteCollection,
};
