'use strict';

/**
 * SQLite connection singleton.
 *
 * DB_PATH env var:
 *   - omitted (default) → ./data/museum.db  (created automatically)
 *   - ':memory:'        → in-memory DB (used in tests via NODE_ENV=test default)
 *
 * Tests automatically receive an in-memory DB so every test suite starts clean.
 */

const path    = require('path');
const fs      = require('fs');
const Database = require('better-sqlite3');

const resolveDbPath = () => {
  if (process.env.DB_PATH) return process.env.DB_PATH;
  if (process.env.NODE_ENV === 'test') return ':memory:';

  // Default production/development path → backend/data/museum.db
  const dir = path.join(__dirname, '..', '..', 'data');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return path.join(dir, 'museum.db');
};

let _db = null;

const getDb = () => {
  if (!_db) {
    const dbPath = resolveDbPath();
    _db = new Database(dbPath);
    _db.pragma('journal_mode = WAL');
    _db.pragma('foreign_keys = ON');
    applySchema(_db);
  }
  return _db;
};

/**
 * Close and reset the singleton — used in tests to get a fresh in-memory DB
 * between test suites.
 */
const closeDb = () => {
  if (_db) {
    _db.close();
    _db = null;
  }
};

const applySchema = (db) => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id          TEXT PRIMARY KEY,
      email       TEXT NOT NULL UNIQUE,
      password    TEXT NOT NULL,
      role        TEXT NOT NULL DEFAULT 'user',
      created_at  INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token_hash  TEXT NOT NULL UNIQUE,
      expires_at  INTEGER NOT NULL,
      used_at     INTEGER,
      created_at  INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE INDEX IF NOT EXISTS idx_prt_user_id ON password_reset_tokens(user_id);
    CREATE INDEX IF NOT EXISTS idx_prt_token_hash ON password_reset_tokens(token_hash);

    -- Catalogue tables
    CREATE TABLE IF NOT EXISTS ticket_types (
      id          TEXT PRIMARY KEY,
      name        TEXT NOT NULL,
      description TEXT,
      price       REAL NOT NULL
    );

    CREATE TABLE IF NOT EXISTS membership_tiers (
      id              TEXT PRIMARY KEY,
      name            TEXT NOT NULL,
      price           REAL NOT NULL,
      tax_deductible  REAL,
      description     TEXT
    );

    CREATE TABLE IF NOT EXISTS products (
      id           TEXT PRIMARY KEY,
      name         TEXT NOT NULL,
      description  TEXT,
      price        REAL NOT NULL,
      member_price REAL,
      category     TEXT,
      images       TEXT NOT NULL DEFAULT '[]'
    );

    -- Cart
    CREATE TABLE IF NOT EXISTS cart_items (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id    TEXT    NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      item_type  TEXT    NOT NULL CHECK(item_type IN ('product','ticket','membership')),
      item_id    TEXT    NOT NULL,
      quantity   INTEGER NOT NULL DEFAULT 1,
      unit_price REAL    NOT NULL,
      metadata   TEXT    NOT NULL DEFAULT '{}',
      created_at INTEGER NOT NULL DEFAULT (unixepoch()),
      UNIQUE(user_id, item_type, item_id)
    );

    CREATE INDEX IF NOT EXISTS idx_cart_user ON cart_items(user_id);

    -- Orders
    CREATE TABLE IF NOT EXISTS orders (
      id                 INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id            TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
      payment_intent_id  TEXT NOT NULL UNIQUE,
      amount_cents       INTEGER NOT NULL,
      currency           TEXT NOT NULL,
      provider           TEXT NOT NULL,
      status             TEXT NOT NULL DEFAULT 'paid',
      entitlements_changed INTEGER NOT NULL DEFAULT 0,
      fulfilled_at       INTEGER NOT NULL,
      created_at         INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
  `);

  seedCatalogue(db);
};

const seedCatalogue = (db) => {
  // Ticket types
  const ticketInsert = db.prepare(
    'INSERT OR IGNORE INTO ticket_types (id, name, description, price) VALUES (?,?,?,?)'
  );
  [
    ['ticket-adults',   'Adults',   null,          8.00],
    ['ticket-seniors',  'Seniors',  '65+ with ID', 5.00],
    ['ticket-students', 'Students', 'with ID',     5.00],
  ].forEach(row => ticketInsert.run(...row));

  // Membership tiers
  const membershipInsert = db.prepare(
    'INSERT OR IGNORE INTO membership_tiers (id, name, price, tax_deductible, description) VALUES (?,?,?,?,?)'
  );
  [
    ['membership-individual', 'Individual', 75,  60, 'Free admission for one.'],
    ['membership-dual',       'Dual',       125, 60, 'Free admission for two.'],
    ['membership-supporter',  'Supporter',  300, 60, 'All Dual benefits plus invitation to exclusive Supporter events.'],
  ].forEach(row => membershipInsert.run(...row));

  // Products
  const productInsert = db.prepare(
    `INSERT OR IGNORE INTO products (id, name, description, price, member_price, category, images)
     VALUES (?,?,?,?,?,?,?)`
  );
  [
    [
      'product-braun-watch',
      'Braun Classic Watch',
      "Reissue of the original 1970's design by Dietrich Lubs and Dieter Rams. Matte stainless-steel case, black dial.",
      160.00, 140.00, 'accessories',
      JSON.stringify([
        'https://images.unsplash.com/photo-1523275335684-37898b6baf30?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1542496658-e33a6d0d50f6?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      ]),
    ],
    [
      'product-catalog-book',
      'Exhibition Catalogue',
      'Full-colour collector catalogue of the Masters Old and New exhibition. 224 pages, hardcover.',
      45.00, 38.00, 'books',
      JSON.stringify([
        'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      ]),
    ],
    [
      'product-poster',
      'Dorothea Lange Print',
      'Archival-quality fine-art print from the Dorothea Lange Retrospective. 18" × 24", signed edition.',
      85.00, 72.00, 'prints',
      JSON.stringify([
        'https://images.unsplash.com/photo-1555620956-f64f895fbcd0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      ]),
    ],
  ].forEach(row => productInsert.run(...row));
};

module.exports = { getDb, closeDb };
