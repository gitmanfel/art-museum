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
      images       TEXT NOT NULL DEFAULT '[]',
      stock_quantity INTEGER NOT NULL DEFAULT 0
    );

    -- Collections & Exhibitions
    CREATE TABLE IF NOT EXISTS exhibitions (
      id          TEXT PRIMARY KEY,
      name        TEXT NOT NULL,
      artist      TEXT,
      description TEXT,
      start_date  INTEGER,
      end_date    INTEGER,
      location_floor TEXT,
      image_url   TEXT
    );

    CREATE TABLE IF NOT EXISTS artworks (
      id            TEXT PRIMARY KEY,
      exhibition_id TEXT REFERENCES exhibitions(id) ON DELETE CASCADE,
      title         TEXT NOT NULL,
      artist        TEXT,
      medium        TEXT,
      year          INTEGER,
      dimensions    TEXT,
      image_url     TEXT
    );

    CREATE TABLE IF NOT EXISTS collections (
      id            TEXT PRIMARY KEY,
      name          TEXT NOT NULL,
      description   TEXT,
      category      TEXT,
      era_start     INTEGER,
      era_end       INTEGER,
      image_url     TEXT
    );

    CREATE TABLE IF NOT EXISTS collection_artworks (
      collection_id TEXT NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
      artwork_id    TEXT NOT NULL REFERENCES artworks(id) ON DELETE CASCADE,
      PRIMARY KEY (collection_id, artwork_id)
    );

    CREATE INDEX IF NOT EXISTS idx_artworks_exhibition ON artworks(exhibition_id);
    CREATE INDEX IF NOT EXISTS idx_exhibitions_name ON exhibitions(name);
    CREATE INDEX IF NOT EXISTS idx_collections_name ON collections(name);
    CREATE INDEX IF NOT EXISTS idx_collections_category ON collections(category);

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

  // Migration for existing databases created before inventory tracking.
  ensureColumn(db, 'products', 'stock_quantity', 'INTEGER NOT NULL DEFAULT 0');

  seedCatalogue(db);
};

const ensureColumn = (db, tableName, columnName, columnDefinition) => {
  const columns = db.prepare(`PRAGMA table_info(${tableName})`).all();
  const exists = columns.some((col) => col.name === columnName);
  if (!exists) {
    db.exec(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnDefinition}`);
  }
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
     `INSERT OR IGNORE INTO products (id, name, description, price, member_price, category, images, stock_quantity)
      VALUES (?,?,?,?,?,?,?,?)`
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
      12,
    ],
    [
      'product-catalog-book',
      'Exhibition Catalogue',
      'Full-colour collector catalogue of the Masters Old and New exhibition. 224 pages, hardcover.',
      45.00, 38.00, 'books',
      JSON.stringify([
        'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      ]),
      40,
    ],
    [
      'product-poster',
      'Dorothea Lange Print',
      'Archival-quality fine-art print from the Dorothea Lange Retrospective. 18" × 24", signed edition.',
      85.00, 72.00, 'prints',
      JSON.stringify([
        'https://images.unsplash.com/photo-1555620956-f64f895fbcd0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      ]),
      7,
    ],
  ].forEach(row => productInsert.run(...row));

  // Exhibitions
  const exhibitionInsert = db.prepare(
    'INSERT OR IGNORE INTO exhibitions (id, name, artist, description, start_date, end_date, location_floor, image_url) VALUES (?,?,?,?,?,?,?,?)'
  );
  const dorothea_start = Math.floor(new Date('2024-01-01').getTime() / 1000);
  const dorothea_end = Math.floor(new Date('2024-12-31').getTime() / 1000);
  [
    [
      'exh-dorothea-lange',
      'Dorothea Lange Retrospective',
      'Dorothea Lange',
      'A comprehensive retrospective of the legendary photojournalist who documented the Great Depression and American resilience. Featuring over 100 photographs spanning her career.',
      dorothea_start,
      dorothea_end,
      '2',
      'https://images.unsplash.com/photo-1579783902614-e3fb5141b0cb?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    ],
    [
      'exh-impressionist',
      'Masters Old and New: Impressionism',
      'Multiple Artists',
      'Explore the revolutionary movement that transformed painting forever. Works by Monet, Renoir, Degas, and more.',
      Math.floor(new Date('2024-03-01').getTime() / 1000),
      Math.floor(new Date('2024-06-30').getTime() / 1000),
      '1',
      'https://images.unsplash.com/photo-1578301978162-7aae4d755744?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    ],
  ].forEach(row => exhibitionInsert.run(...row));

  // Artworks (in exhibitions)
  const artworkInsert = db.prepare(
    'INSERT OR IGNORE INTO artworks (id, exhibition_id, title, artist, medium, year, dimensions, image_url) VALUES (?,?,?,?,?,?,?,?)'
  );
  artworkInsert.run('artwork-lange-1', 'exh-dorothea-lange', 'Migrant Mother', 'Dorothea Lange', 'Gelatin silver print', 1936, '9.75" × 7.625"', 'https://images.unsplash.com/photo-1577720643272-265dc7a0922b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80');
  artworkInsert.run('artwork-lange-2', 'exh-dorothea-lange', 'American Exodus', 'Dorothea Lange', 'Gelatin silver print', 1939, '10" × 8"', 'https://images.unsplash.com/photo-1579783902614-e3fb5141b0cb?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80');
  artworkInsert.run('artwork-monet-1', 'exh-impressionist', 'Water Lilies', 'Claude Monet', 'Oil on canvas', 1906, '79.9" × 79.9"', 'https://images.unsplash.com/photo-1577720643272-265dc7a0922b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80');
  artworkInsert.run('artwork-renoir-1', 'exh-impressionist', 'Luncheon of the Boating Party', 'Pierre-Auguste Renoir', 'Oil on canvas', 1880, '51.2" × 68"', 'https://images.unsplash.com/photo-1578301978162-7aae4d755744?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80');

  // Collections
  const collectionInsert = db.prepare(
    'INSERT OR IGNORE INTO collections (id, name, description, category, era_start, era_end, image_url) VALUES (?,?,?,?,?,?,?)'
  );
  [
    [
      'coll-decorative-arts',
      'Decorative Arts',
      'A curated selection of furniture, ceramics, glass, and metalwork spanning multiple centuries.',
      'decorative-arts',
      1700,
      2000,
      'https://images.unsplash.com/photo-1578301978162-7aae4d755744?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    ],
    [
      'coll-impressionism',
      'Impressionism',
      'The revolutionary movement that changed art forever. Light, color, and momentary impressions.',
      'paintings',
      1870,
      1900,
      'https://images.unsplash.com/photo-1577720643272-265dc7a0922b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    ],
    [
      'coll-photography',
      'Documentary Photography',
      'Powerful images that capture human stories and historical moments.',
      'photography',
      1900,
      2000,
      'https://images.unsplash.com/photo-1579783902614-e3fb5141b0cb?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    ],
    [
      'coll-contemporary',
      'Contemporary Art',
      'Bold new voices and innovative mediums from the 21st century.',
      'contemporary',
      2000,
      2024,
      'https://images.unsplash.com/photo-1577720643272-265dc7a0922b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    ],
  ].forEach(row => collectionInsert.run(...row));

  // Link artworks to collections
  const linkCollectionArtwork = db.prepare(
    'INSERT OR IGNORE INTO collection_artworks (collection_id, artwork_id) VALUES (?,?)'
  );
  linkCollectionArtwork.run('coll-photography', 'artwork-lange-1');
  linkCollectionArtwork.run('coll-photography', 'artwork-lange-2');
  linkCollectionArtwork.run('coll-impressionism', 'artwork-monet-1');
  linkCollectionArtwork.run('coll-impressionism', 'artwork-renoir-1');
};

module.exports = { getDb, closeDb };
