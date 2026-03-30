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
const bcrypt = require('bcrypt');
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
      image_url   TEXT,
      updated_at  INTEGER NOT NULL DEFAULT (unixepoch())
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
      image_url     TEXT,
      updated_at    INTEGER NOT NULL DEFAULT (unixepoch())
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

    CREATE TABLE IF NOT EXISTS contact_messages (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      name        TEXT NOT NULL,
      email       TEXT NOT NULL,
      subject     TEXT NOT NULL,
      message     TEXT NOT NULL,
      replied_at  INTEGER,
      replied_by  TEXT,
      created_at  INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE INDEX IF NOT EXISTS idx_contact_messages_created ON contact_messages(created_at);

    CREATE TABLE IF NOT EXISTS newsletter_subscribers (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      email       TEXT NOT NULL UNIQUE,
      full_name   TEXT,
      is_active   INTEGER NOT NULL DEFAULT 1,
      created_at  INTEGER NOT NULL DEFAULT (unixepoch()),
      updated_at  INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_active ON newsletter_subscribers(is_active);

    CREATE TABLE IF NOT EXISTS inventory_reservations (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      product_id  TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      quantity    INTEGER NOT NULL,
      expires_at  INTEGER NOT NULL,
      created_at  INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE INDEX IF NOT EXISTS idx_inv_res_user ON inventory_reservations(user_id);
    CREATE INDEX IF NOT EXISTS idx_inv_res_product_expires ON inventory_reservations(product_id, expires_at);

    CREATE TABLE IF NOT EXISTS admin_audit_logs (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      actor_user_id TEXT NOT NULL,
      actor_email  TEXT,
      action       TEXT NOT NULL,
      entity_type  TEXT NOT NULL,
      entity_id    TEXT NOT NULL,
      before_json  TEXT,
      after_json   TEXT,
      created_at   INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE INDEX IF NOT EXISTS idx_admin_audit_created ON admin_audit_logs(created_at);
    CREATE INDEX IF NOT EXISTS idx_admin_audit_entity ON admin_audit_logs(entity_type, entity_id);
  `);

  // Migration for existing databases created before inventory tracking.
  ensureColumn(db, 'products', 'stock_quantity', 'INTEGER NOT NULL DEFAULT 0');
  ensureColumn(db, 'collections', 'updated_at', 'INTEGER NOT NULL DEFAULT 0');
  ensureColumn(db, 'exhibitions', 'updated_at', 'INTEGER NOT NULL DEFAULT 0');
  ensureColumn(db, 'contact_messages', 'replied_at', 'INTEGER');
  ensureColumn(db, 'contact_messages', 'replied_by', 'TEXT');

  db.exec('UPDATE collections SET updated_at = unixepoch() WHERE updated_at = 0');
  db.exec('UPDATE exhibitions SET updated_at = unixepoch() WHERE updated_at = 0');

  seedDefaultAdmin(db);
  seedCatalogue(db);
  seedCommunications(db);
};

const seedDefaultAdmin = (db) => {
  const existingAdmin = db
    .prepare("SELECT id FROM users WHERE role = 'admin' LIMIT 1")
    .get();

  if (existingAdmin) return;

  const email = 'admin@museum.local';
  const existingEmail = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existingEmail) {
    db.prepare("UPDATE users SET role = 'admin' WHERE email = ?").run(email);
    return;
  }

  const passwordHash = bcrypt.hashSync('AdminPass123!', 10);
  const id = `usr_${Math.random().toString(36).slice(2, 10)}`;

  db.prepare(
    `INSERT INTO users (id, email, password, role)
     VALUES (?, ?, ?, 'admin')`
  ).run(id, email, passwordHash);
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
    ['ticket-child', 'Children', 'Ages 6-12', 3.00],
    ['ticket-family-pack', 'Family Pack', '2 adults + 2 children', 20.00],
    ['ticket-guided-tour', 'Guided Tour Add-on', '90-minute curator-led tour', 12.00],
    ['ticket-audio-guide', 'Audio Guide', 'Self-guided multilingual audio tour', 4.00],
    ['ticket-evening-pass', 'Evening Pass', 'Entry after 5pm', 6.00],
    ['ticket-weekend-pass', 'Weekend Pass', 'Single-day weekend admission', 10.00],
    ['ticket-accessibility', 'Accessibility Companion', 'Companion admission for accessibility support', 0.00],
    ['ticket-school-group', 'School Group', 'Per student (10+ students)', 2.50],
  ].forEach(row => ticketInsert.run(...row));

  // Membership tiers
  const membershipInsert = db.prepare(
    'INSERT OR IGNORE INTO membership_tiers (id, name, price, tax_deductible, description) VALUES (?,?,?,?,?)'
  );
  [
    ['membership-individual', 'Individual', 75,  60, 'Free admission for one.'],
    ['membership-dual',       'Dual',       125, 60, 'Free admission for two.'],
    ['membership-supporter',  'Supporter',  300, 60, 'All Dual benefits plus invitation to exclusive Supporter events.'],
    ['membership-student', 'Student', 45, 30, 'Discounted annual access for students with valid ID.'],
    ['membership-family', 'Family', 180, 95, 'Admission for two adults and up to three children.'],
    ['membership-patron', 'Patron', 600, 240, 'Includes previews and curator talks.'],
    ['membership-benefactor', 'Benefactor', 1200, 360, 'VIP access to openings and patron lounge.'],
    ['membership-corporate', 'Corporate', 2500, 700, 'Team access and private event allocations.'],
    ['membership-lifetime', 'Lifetime', 5000, 1200, 'Lifetime admission and premium program access.'],
    ['membership-young-collector', 'Young Collector', 220, 85, 'Member events focused on emerging collectors.'],
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
    [
      'product-postcard-set',
      'Museum Postcard Set',
      'Set of 24 premium postcards featuring iconic works from the permanent collection.',
      22.00, 18.00, 'stationery',
      JSON.stringify([
        'https://images.unsplash.com/photo-1471357674240-e1a485acb3e1?auto=format&fit=crop&w=800&q=80',
      ]),
      120,
    ],
    [
      'product-tote-bag',
      'Canvas Museum Tote',
      'Heavyweight canvas tote with embroidered museum mark and interior pocket.',
      38.00, 32.00, 'accessories',
      JSON.stringify([
        'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=800&q=80',
      ]),
      65,
    ],
    [
      'product-sketchbook',
      'Artist Sketchbook',
      'A4 archival sketchbook with 160 gsm paper for graphite, ink, and light watercolor.',
      28.00, 24.00, 'stationery',
      JSON.stringify([
        'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=800&q=80',
      ]),
      90,
    ],
    [
      'product-ceramic-mug',
      'Gallery Ceramic Mug',
      'Stoneware mug inspired by geometric motifs from the decorative arts wing.',
      26.00, 22.00, 'home',
      JSON.stringify([
        'https://images.unsplash.com/photo-1514228742587-6b1558fcf93a?auto=format&fit=crop&w=800&q=80',
      ]),
      80,
    ],
    [
      'product-silk-scarf',
      'Impressionist Silk Scarf',
      '100% silk scarf featuring color studies inspired by Monet brushwork.',
      95.00, 82.00, 'fashion',
      JSON.stringify([
        'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=800&q=80',
      ]),
      22,
    ],
    [
      'product-architectural-model',
      'Museum Building Miniature',
      'Precision-cut collectible model of the museum architecture.',
      140.00, 125.00, 'collectibles',
      JSON.stringify([
        'https://images.unsplash.com/photo-1523419409543-a5e549c1f2e8?auto=format&fit=crop&w=800&q=80',
      ]),
      14,
    ],
    [
      'product-photo-book',
      'Street Photography Anthology',
      'Large-format photography anthology with essays by contemporary curators.',
      62.00, 54.00, 'books',
      JSON.stringify([
        'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&w=800&q=80',
      ]),
      33,
    ],
    [
      'product-pencil-set',
      'Museum Pencil Set',
      'Twelve graphite pencils with artwork-inspired barrel finishes.',
      16.00, 13.00, 'stationery',
      JSON.stringify([
        'https://images.unsplash.com/photo-1448475930087-3b8f5cb1f1e0?auto=format&fit=crop&w=800&q=80',
      ]),
      150,
    ],
    [
      'product-limited-print-01',
      'Limited Giclee Print No. 1',
      'Museum-certified limited edition giclee print on archival cotton rag.',
      220.00, 195.00, 'prints',
      JSON.stringify([
        'https://images.unsplash.com/photo-1578926288207-a90a5366759d?auto=format&fit=crop&w=800&q=80',
      ]),
      9,
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
    [
      'exh-renaissance-reframed',
      'Renaissance Reframed',
      'Multiple Artists',
      'Masterworks from Renaissance ateliers paired with modern reinterpretations.',
      Math.floor(new Date('2024-04-15').getTime() / 1000),
      Math.floor(new Date('2024-11-20').getTime() / 1000),
      '3',
      'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?auto=format&fit=crop&w=800&q=80',
    ],
    [
      'exh-abstract-dialogues',
      'Abstract Dialogues',
      'Multiple Artists',
      'Color, gesture, and form across abstract movements from 1910 to now.',
      Math.floor(new Date('2024-05-01').getTime() / 1000),
      Math.floor(new Date('2024-12-15').getTime() / 1000),
      '4',
      'https://images.unsplash.com/photo-1577083165633-14ebcdb0f658?auto=format&fit=crop&w=800&q=80',
    ],
    [
      'exh-sculpture-light',
      'Sculpture in Light',
      'Multiple Artists',
      'An exploration of sculpture with dynamic lighting and immersive staging.',
      Math.floor(new Date('2024-06-01').getTime() / 1000),
      Math.floor(new Date('2025-01-10').getTime() / 1000),
      '5',
      'https://images.unsplash.com/photo-1473447198193-cd2ec8c8cda7?auto=format&fit=crop&w=800&q=80',
    ],
    [
      'exh-modern-africa',
      'Modern Africa',
      'Multiple Artists',
      'Twentieth-century and contemporary African art across media.',
      Math.floor(new Date('2024-06-10').getTime() / 1000),
      Math.floor(new Date('2025-02-05').getTime() / 1000),
      '2',
      'https://images.unsplash.com/photo-1518991791750-7494e7ff7e76?auto=format&fit=crop&w=800&q=80',
    ],
    [
      'exh-design-century',
      'A Century of Design',
      'Multiple Designers',
      'Furniture, typography, and product design milestones from 1920 onward.',
      Math.floor(new Date('2024-07-01').getTime() / 1000),
      Math.floor(new Date('2025-03-01').getTime() / 1000),
      '6',
      'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&w=800&q=80',
    ],
    [
      'exh-city-photography',
      'Cities in Focus',
      'Multiple Photographers',
      'Street and documentary photography tracing urban transformation.',
      Math.floor(new Date('2024-07-20').getTime() / 1000),
      Math.floor(new Date('2025-02-28').getTime() / 1000),
      '2',
      'https://images.unsplash.com/photo-1504196606672-aef5c9cefc92?auto=format&fit=crop&w=800&q=80',
    ],
    [
      'exh-new-media-lab',
      'New Media Lab',
      'Digital Artists',
      'Interactive digital installations, projection mapping, and generative art.',
      Math.floor(new Date('2024-08-05').getTime() / 1000),
      Math.floor(new Date('2025-04-05').getTime() / 1000),
      '7',
      'https://images.unsplash.com/photo-1518779578993-ec3579fee39f?auto=format&fit=crop&w=800&q=80',
    ],
    [
      'exh-ceramics-earth',
      'Ceramics and Earth',
      'Multiple Artists',
      'Hand-built and wheel-thrown ceramic works from global traditions.',
      Math.floor(new Date('2024-09-01').getTime() / 1000),
      Math.floor(new Date('2025-03-20').getTime() / 1000),
      '3',
      'https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=800&q=80',
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
  [
    ['artwork-renaissance-1', 'exh-renaissance-reframed', 'Study of Drapery', 'Workshop of Verrocchio', 'Tempera on panel', 1475, '24" × 18"', 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?auto=format&fit=crop&w=800&q=80'],
    ['artwork-abstract-1', 'exh-abstract-dialogues', 'Chromatic Pulse', 'Elena Markov', 'Acrylic on canvas', 1964, '40" × 60"', 'https://images.unsplash.com/photo-1577083165633-14ebcdb0f658?auto=format&fit=crop&w=800&q=80'],
    ['artwork-sculpture-1', 'exh-sculpture-light', 'Bronze Helix', 'Marco Vidal', 'Bronze', 1998, '72" × 24" × 24"', 'https://images.unsplash.com/photo-1473447198193-cd2ec8c8cda7?auto=format&fit=crop&w=800&q=80'],
    ['artwork-africa-1', 'exh-modern-africa', 'Market at Dawn', 'Ayo Okafor', 'Oil on linen', 1974, '36" × 48"', 'https://images.unsplash.com/photo-1518991791750-7494e7ff7e76?auto=format&fit=crop&w=800&q=80'],
    ['artwork-design-1', 'exh-design-century', 'Modular Chair Prototype', 'Klara Weiss', 'Wood and steel', 1956, '34" × 22" × 24"', 'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&w=800&q=80'],
    ['artwork-city-1', 'exh-city-photography', 'Midnight Crossing', 'Luis Ortega', 'Digital print', 2013, '30" × 45"', 'https://images.unsplash.com/photo-1504196606672-aef5c9cefc92?auto=format&fit=crop&w=800&q=80'],
    ['artwork-newmedia-1', 'exh-new-media-lab', 'Signal Bloom', 'Rina Cao', 'Interactive LED installation', 2022, 'Variable', 'https://images.unsplash.com/photo-1518779578993-ec3579fee39f?auto=format&fit=crop&w=800&q=80'],
    ['artwork-ceramics-1', 'exh-ceramics-earth', 'Vessel Series IV', 'Nadia Kline', 'Stoneware', 2019, '18" × 12"', 'https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=800&q=80'],
  ].forEach((row) => artworkInsert.run(...row));

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
    [
      'coll-sculpture',
      'Modern Sculpture',
      'Stone, bronze, and mixed-media sculpture from 1900 to present.',
      'sculpture',
      1900,
      2024,
      'https://images.unsplash.com/photo-1473447198193-cd2ec8c8cda7?auto=format&fit=crop&w=800&q=80',
    ],
    [
      'coll-design',
      'Design Objects',
      'Iconic furniture and objects from modern design movements.',
      'design',
      1920,
      2024,
      'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&w=800&q=80',
    ],
    [
      'coll-african-modern',
      'African Modernism',
      'Paintings and sculpture from key African modernist artists.',
      'paintings',
      1940,
      2000,
      'https://images.unsplash.com/photo-1518991791750-7494e7ff7e76?auto=format&fit=crop&w=800&q=80',
    ],
    [
      'coll-new-media',
      'New Media',
      'Interactive works, projection, and code-driven art practices.',
      'digital',
      1990,
      2024,
      'https://images.unsplash.com/photo-1518779578993-ec3579fee39f?auto=format&fit=crop&w=800&q=80',
    ],
    [
      'coll-prints',
      'Prints & Works on Paper',
      'Etchings, lithographs, and contemporary works on paper.',
      'prints',
      1750,
      2024,
      'https://images.unsplash.com/photo-1555620956-f64f895fbcd0?auto=format&fit=crop&w=800&q=80',
    ],
    [
      'coll-ceramics',
      'Ceramics',
      'Historic and contemporary ceramic works from international makers.',
      'ceramics',
      1600,
      2024,
      'https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=800&q=80',
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
  linkCollectionArtwork.run('coll-sculpture', 'artwork-sculpture-1');
  linkCollectionArtwork.run('coll-design', 'artwork-design-1');
  linkCollectionArtwork.run('coll-african-modern', 'artwork-africa-1');
  linkCollectionArtwork.run('coll-new-media', 'artwork-newmedia-1');
  linkCollectionArtwork.run('coll-prints', 'artwork-city-1');
  linkCollectionArtwork.run('coll-ceramics', 'artwork-ceramics-1');
};

const seedCommunications = (db) => {
  const messageCount = db.prepare('SELECT COUNT(*) as count FROM contact_messages').get().count;
  if (messageCount === 0) {
    const insertMessage = db.prepare(
      `INSERT INTO contact_messages (name, email, subject, message, created_at)
       VALUES (?, ?, ?, ?, ?)`
    );

    const now = Math.floor(Date.now() / 1000);
    [
      ['Amina Diallo', 'amina@example.com', 'School Visit Booking', 'We would like to book a school group tour for next month.'],
      ['Liam Chen', 'liam@example.com', 'Membership Renewal', 'My membership renewal payment failed. Can you assist?'],
      ['Sofia Rossi', 'sofia@example.com', 'Accessible Entrance', 'Is the north entrance wheelchair accessible?'],
      ['Noah Patel', 'noah@example.com', 'Private Event Request', 'I am interested in hosting a private reception at the museum.'],
      ['Emma Johnson', 'emma@example.com', 'Lost Item', 'I may have left my sketchbook in gallery 3 yesterday.'],
      ['Youssef Karim', 'youssef@example.com', 'Photography Policy', 'Can I take photos in the temporary exhibition rooms?'],
      ['Maya Thompson', 'maya@example.com', 'Guided Tour Language', 'Do you offer guided tours in French or Arabic?'],
      ['Oliver Brown', 'oliver@example.com', 'Group Discount', 'Is there a corporate group rate for 20 visitors?'],
      ['Zara Ahmed', 'zara@example.com', 'Ticket Refund', 'Can I change my ticket date if I cannot attend?'],
      ['Hugo Martin', 'hugo@example.com', 'Volunteer Program', 'I am interested in volunteering as a weekend guide.'],
    ].forEach((row, index) => insertMessage.run(...row, now - index * 3600));
  }

  const subscriberInsert = db.prepare(
    `INSERT OR IGNORE INTO newsletter_subscribers (email, full_name, is_active)
     VALUES (?, ?, 1)`
  );
  [
    ['subscriber01@example.com', 'Nora Hall'],
    ['subscriber02@example.com', 'Ethan Price'],
    ['subscriber03@example.com', 'Mila Green'],
    ['subscriber04@example.com', 'Lucas Reed'],
    ['subscriber05@example.com', 'Aria Scott'],
    ['subscriber06@example.com', 'Leo Foster'],
    ['subscriber07@example.com', 'Ava Barnes'],
    ['subscriber08@example.com', 'Mason Bell'],
    ['subscriber09@example.com', 'Ella Wood'],
    ['subscriber10@example.com', 'James Perry'],
  ].forEach((row) => subscriberInsert.run(...row));
};

module.exports = { getDb, closeDb };
