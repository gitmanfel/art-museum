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
  // Ticket types (25+ options)
  const ticketInsert = db.prepare(
    'INSERT OR IGNORE INTO ticket_types (id, name, description, price) VALUES (?,?,?,?)'
  );
  [
    ['ticket-adults',   'Adults',   'General admission',          8.00],
    ['ticket-seniors',  'Seniors',  '65+ with valid ID', 5.00],
    ['ticket-students', 'Students', 'With valid student ID',     5.00],
    ['ticket-child', 'Children', 'Ages 6-12', 3.00],
    ['ticket-child-under-5', 'Young Children', 'Under 5', 0.00],
    ['ticket-family-pack', 'Family Pack', '2 adults + 2 children', 20.00],
    ['ticket-family-pack-4', 'Family Pack Plus', '2 adults + 3-4 children', 28.00],
    ['ticket-guided-tour', 'Guided Tour Add-on', '90-minute curator-led tour', 12.00],
    ['ticket-guided-premium', 'Premium Private Tour', 'Private 2-hour VIP tour (up to 6)', 150.00],
    ['ticket-audio-guide', 'Audio Guide', 'Self-guided multilingual audio tour', 4.00],
    ['ticket-audio-premium', 'Premium Audio Guide', 'Premium narration by art historians', 8.00],
    ['ticket-evening-pass', 'Evening Pass', 'Entry after 5pm', 6.00],
    ['ticket-weekend-pass', 'Weekend Pass', 'Single-day weekend admission', 10.00],
    ['ticket-7day-pass', '7-Day Pass', 'Unlimited 7-day admission', 35.00],
    ['ticket-annual-pass', 'Annual Pass', 'Unlimited admission for one year', 120.00],
    ['ticket-accessibility', 'Accessibility Companion', 'Companion admission for accessibility support', 0.00],
    ['ticket-school-group', 'School Group', 'Per student (10+ students)', 2.50],
    ['ticket-youth-group', 'Youth Group', 'Ages 13-18 group rate (15+)', 4.00],
    ['ticket-educator', 'Educator Pass', 'Free admission with school ID', 0.00],
    ['ticket-photographer', 'Photography Pass', 'Commercial photography session', 75.00],
    ['ticket-night-gala', 'Evening Gala', 'Exclusive evening event access', 45.00],
    ['ticket-exhibit-special', 'Special Exhibit', 'Temporary exhibition only', 6.00],
    ['ticket-sunrise', 'Sunrise Access', 'Early entry (8am opening)', 12.00],
    ['ticket-research', 'Research Access', 'Museum archives and collections access', 25.00],
    ['ticket-group-corporate', 'Corporate Group', 'Per person (20+ staff)', 6.50],
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

  // Products (25+ items across categories)
  const productInsert = db.prepare(
     `INSERT OR IGNORE INTO products (id, name, description, price, member_price, category, images, stock_quantity)
      VALUES (?,?,?,?,?,?,?,?)`
  );
  [
    // Accessories (6)
    [
      'product-braun-watch',
      'Braun Classic Watch',
      "Reissue of the original 1970's design by Dietrich Lubs and Dieter Rams. Matte stainless-steel case, black dial.",
      160.00, 140.00, 'accessories',
      JSON.stringify([
        'https://images.unsplash.com/photo-1523275335684-37898b6baf30?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1542496658-e33a6d0d50f6?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      ]),
      12,
    ],
    [
      'product-tote-bag',
      'Canvas Museum Tote',
      'Heavyweight canvas tote with embroidered museum mark and interior pocket.',
      38.00, 32.00, 'accessories',
      JSON.stringify(['https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=800&q=80']),
      65,
    ],
    [
      'product-leather-bag',
      'Museum Leather Satchel',
      'Premium Italian leather messenger bag with museum insignia.',
      185.00, 165.00, 'accessories',
      JSON.stringify(['https://images.unsplash.com/photo-1520527514037-d4369daaf41f?auto=format&fit=crop&w=800&q=80']),
      18,
    ],
    [
      'product-scarf-silk',
      'Impressionist Silk Scarf',
      '100% silk scarf featuring color studies inspired by Monet brushwork.',
      95.00, 82.00, 'accessories',
      JSON.stringify(['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=800&q=80']),
      22,
    ],
    [
      'product-hat-museum',
      'Museum Baseball Cap',
      'Adjustable cotton cap with embroidered logo in classic navy.',
      28.00, 24.00, 'accessories',
      JSON.stringify(['https://images.unsplash.com/photo-1562157873-0fcf8f90a35b?auto=format&fit=crop&w=800&q=80']),
      95,
    ],
    [
      'product-jewelry-earrings',
      'Art Deco Inspired Earrings',
      'Sterling silver earrings with semi-precious stone details.',
      120.00, 105.00, 'accessories',
      JSON.stringify(['https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=800&q=80']),
      16,
    ],
    // Books (6)
    [
      'product-catalog-book',
      'Exhibition Catalogue',
      'Full-colour collector catalogue of the Masters Old and New exhibition. 224 pages, hardcover.',
      45.00, 38.00, 'books',
      JSON.stringify(['https://images.unsplash.com/photo-1589829085413-56de8ae18c73?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80']),
      40,
    ],
    [
      'product-photo-book',
      'Street Photography Anthology',
      'Large-format photography anthology with essays by contemporary curators. 352 pages.',
      62.00, 54.00, 'books',
      JSON.stringify(['https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&w=800&q=80']),
      33,
    ],
    [
      'product-art-history-book',
      'Art History Essentials',
      'Comprehensive 500-page guide to major movements from Renaissance to contemporary.',
      68.00, 58.00, 'books',
      JSON.stringify(['https://images.unsplash.com/photo-1507842217343-583f20270319?auto=format&fit=crop&w=800&q=80']),
      28,
    ],
    [
      'product-design-book',
      'Design: Form and Function',
      'Illustrated exploration of 20th-century design principles.',
      55.00, 48.00, 'books',
      JSON.stringify(['https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=800&q=80']),
      26,
    ],
    [
      'product-biography-book',
      'Artist Biography: Lives and Legacies',
      'Profiles of 30 influential artists who shaped modern art.',
      50.00, 43.00, 'books',
      JSON.stringify(['https://images.unsplash.com/photo-1507842217343-583f20270319?auto=format&fit=crop&w=800&q=80']),
      31,
    ],
    [
      'product-memoir-book',
      'Museum Director\'s Memoir',
      'Behind-the-scenes stories from 25 years leading the museum.',
      42.00, 36.00, 'books',
      JSON.stringify(['https://images.unsplash.com/photo-1495446815901-130db73d6caf?auto=format&fit=crop&w=800&q=80']),
      19,
    ],
    // Prints (5)
    [
      'product-poster',
      'Dorothea Lange Print',
      'Archival-quality fine-art print from the Dorothea Lange Retrospective. 18" × 24", signed edition.',
      85.00, 72.00, 'prints',
      JSON.stringify(['https://images.unsplash.com/photo-1555620956-f64f895fbcd0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80']),
      7,
    ],
    [
      'product-limited-print-01',
      'Limited Giclee Print No. 1',
      'Museum-certified limited edition giclee print on archival cotton rag. Ed. 5/50',
      220.00, 195.00, 'prints',
      JSON.stringify(['https://images.unsplash.com/photo-1578926288207-a90a5366759d?auto=format&fit=crop&w=800&q=80']),
      9,
    ],
    [
      'product-giclee-impressionist',
      'Monet Water Lilies Giclee',
      'Museum-quality giclee print. 24" × 30".',
      175.00, 150.00, 'prints',
      JSON.stringify(['https://images.unsplash.com/photo-1561214115-6d2f1b0609fa?auto=format&fit=crop&w=800&q=80']),
      12,
    ],
    [
      'product-poster-abstract',
      'Abstract Expressionist Print',
      'Contemporary poster from the Abstract Dialogues exhibition.',
      48.00, 41.00, 'prints',
      JSON.stringify(['https://images.unsplash.com/photo-1549887534-f3e29a01fe94?auto=format&fit=crop&w=800&q=80']),
      35,
    ],
    [
      'product-lithograph-vintage',
      'Vintage Lithograph',
      'Original lithograph from 1960s street art movement.',
      320.00, 280.00, 'prints',
      JSON.stringify(['https://images.unsplash.com/photo-1561214115-6d2f1b0609fa?auto=format&fit=crop&w=800&q=80']),
      4,
    ],
    // Stationery (5)
    [
      'product-postcard-set',
      'Museum Postcard Set',
      'Set of 24 premium postcards featuring iconic works from the permanent collection.',
      22.00, 18.00, 'stationery',
      JSON.stringify(['https://images.unsplash.com/photo-1471357674240-e1a485acb3e1?auto=format&fit=crop&w=800&q=80']),
      120,
    ],
    [
      'product-postcard-contemporary',
      'Contemporary Artist Postcard Set',
      'Set of 15 postcards by featured contemporary artists.',
      18.00, 15.00, 'stationery',
      JSON.stringify(['https://images.unsplash.com/photo-1471357674240-e1a485acb3e1?auto=format&fit=crop&w=800&q=80']),
      85,
    ],
    [
      'product-sketchbook',
      'Artist Sketchbook',
      'A4 archival sketchbook with 160 gsm paper for graphite, ink, and light watercolor.',
      28.00, 24.00, 'stationery',
      JSON.stringify(['https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=800&q=80']),
      90,
    ],
    [
      'product-pencil-set',
      'Museum Pencil Set',
      'Twelve graphite pencils with artwork-inspired barrel finishes.',
      16.00, 13.00, 'stationery',
      JSON.stringify(['https://images.unsplash.com/photo-1448475930087-3b8f5cb1f1e0?auto=format&fit=crop&w=800&q=80']),
      150,
    ],
    [
      'product-journal-leather',
      'Leather Notebook',
      'Handbound Italian leather journal with museum embossing.',
      55.00, 47.00, 'stationery',
      JSON.stringify(['https://images.unsplash.com/photo-1507842217343-583f20270319?auto=format&fit=crop&w=800&q=80']),
      42,
    ],
    // Home & Fashion (4)
    [
      'product-ceramic-mug',
      'Gallery Ceramic Mug',
      'Stoneware mug inspired by geometric motifs from the decorative arts wing.',
      26.00, 22.00, 'home',
      JSON.stringify(['https://images.unsplash.com/photo-1514228742587-6b1558fcf93a?auto=format&fit=crop&w=800&q=80']),
      80,
    ],
    [
      'product-ceramic-plate',
      'Museum Ceramic Plate',
      'Handcrafted ceramic dinner plate by museum artisan-in-residence.',
      42.00, 36.00, 'home',
      JSON.stringify(['https://images.unsplash.com/photo-1578500494198-246f612d03b3?auto=format&fit=crop&w=800&q=80']),
      24,
    ],
    [
      'product-throw-blanket',
      'Museum throw blanket',
      'Merino wool throw with museum color palette and pattern.',
      78.00, 68.00, 'home',
      JSON.stringify(['https://images.unsplash.com/photo-1555073814-74e89e4a1816?auto=format&fit=crop&w=800&q=80']),
      31,
    ],
    // Collectibles (2)
    [
      'product-architectural-model',
      'Museum Building Miniature',
      'Precision-cut collectible model of the museum architecture.',
      140.00, 125.00, 'collectibles',
      JSON.stringify(['https://images.unsplash.com/photo-1523419409543-a5e549c1f2e8?auto=format&fit=crop&w=800&q=80']),
      14,
    ],
    [
      'product-sculpture-replica',
      'Bronze Sculpture Replica',
      '1/8 scale museum-authorized bronze replica from New Media Lab collection.',
      250.00, 220.00, 'collectibles',
      JSON.stringify(['https://images.unsplash.com/photo-1518779578993-ec3579fee39f?auto=format&fit=crop&w=800&q=80']),
      6,
    ],
  ].forEach(row => productInsert.run(...row));

  // Exhibitions (25+)
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
    [
      'exh-baroque-returns',
      'Baroque Returns',
      'Multiple Artists',
      'Drama, opulence, and emotion: exploring the legacy of Baroque art in contemporary practice.',
      Math.floor(new Date('2024-10-01').getTime() / 1000),
      Math.floor(new Date('2025-01-31').getTime() / 1000),
      '1',
      'https://images.unsplash.com/photo-1578926314433-c6db0bd1f9ae?auto=format&fit=crop&w=800&q=80',
    ],
    [
      'exh-minimalism-maximalism',
      'Minimalism vs Maximalism',
      'Multiple Artists',
      'Two opposing aesthetics in constant dialogue. From silence to cacophony.',
      Math.floor(new Date('2024-10-15').getTime() / 1000),
      Math.floor(new Date('2025-02-14').getTime() / 1000),
      '4',
      'https://images.unsplash.com/photo-1577720643272-265dc7a0922b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    ],
    [
      'exh-feminist-perspectives',
      'Feminist Perspectives: Women Artists Now',
      'Multiple Artists',
      'Groundbreaking works by women artists who are reshaping contemporary art.',
      Math.floor(new Date('2024-11-01').getTime() / 1000),
      Math.floor(new Date('2025-03-15').getTime() / 1000),
      '5',
      'https://images.unsplash.com/photo-1579783902614-e3fb5141b0cb?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    ],
    [
      'exh-global-textiles',
      'Global Textiles: Threads of Culture',
      'Multiple Makers',
      'Woven, embroidered, and dyed textiles from six continents.',
      Math.floor(new Date('2024-11-15').getTime() / 1000),
      Math.floor(new Date('2025-04-10').getTime() / 1000),
      '2',
      'https://images.unsplash.com/photo-1451188089933-7621c3f78e4d?auto=format&fit=crop&w=800&q=80',
    ],
    [
      'exh-surrealism-dreams',
      'Surrealism and Dreams',
      'Multiple Artists',
      'Journey through the unconscious with Dalí, Magritte, and contemporary dreamers.',
      Math.floor(new Date('2024-12-01').getTime() / 1000),
      Math.floor(new Date('2025-03-30').getTime() / 1000),
      '6',
      'https://images.unsplash.com/photo-1552820728-8ac41f1ce891?auto=format&fit=crop&w=800&q=80',
    ],
    [
      'exh-land-art-now',
      'Land Art Now',
      'Multiple Artists',
      'Contemporary artists engaged with landscape and environmental consciousness.',
      Math.floor(new Date('2024-12-15').getTime() / 1000),
      Math.floor(new Date('2025-04-20').getTime() / 1000),
      '7',
      'https://images.unsplash.com/photo-1577084630692-0d4a50a1abc5?auto=format&fit=crop&w=800&q=80',
    ],
    [
      'exh-classical-revisited',
      'Classical Revisited',
      'Multiple Artists',
      'Contemporary responses to classical sculpture and form.',
      Math.floor(new Date('2024-01-15').getTime() / 1000),
      Math.floor(new Date('2024-05-30').getTime() / 1000),
      '3',
      'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=800&q=80',
    ],
    [
      'exh-color-theory',
      'The Color Show: Physics and Perception',
      'Multiple Artists',
      'Exploring how artists use color as medium and message.',
      Math.floor(new Date('2024-02-01').getTime() / 1000),
      Math.floor(new Date('2024-07-15').getTime() / 1000),
      '5',
      'https://images.unsplash.com/photo-1578926340990-eabf1f2e1f6e?auto=format&fit=crop&w=800&q=80',
    ],
    [
      'exh-identity-migration',
      'Identity and Migration',
      'Multiple Artists',
      'Art exploring belonging, displacement, and cultural intersection.',
      Math.floor(new Date('2024-02-20').getTime() / 1000),
      Math.floor(new Date('2024-08-30').getTime() / 1000),
      '4',
      'https://images.unsplash.com/photo-1579783902195-4a6b6e5bbc2e?auto=format&fit=crop&w=800&q=80',
    ],
    [
      'exh-pop-art-legacy',
      'Pop Art Legacies',
      'Warhol, Lichtenstein, and Contemporaries',
      'From Warhol to Instagram: how pop art predicted our visual culture.',
      Math.floor(new Date('2024-03-10').getTime() / 1000),
      Math.floor(new Date('2024-09-20').getTime() / 1000),
      '1',
      'https://images.unsplash.com/photo-1556740738-b6a63e27c4df?auto=format&fit=crop&w=800&q=80',
    ],
    [
      'exh-kinetic-motion',
      'Kinetic: Art in Motion',
      'Multiple Artists',
      'Sculptures and installations that move, react, and inspire.',
      Math.floor(new Date('2024-03-25').getTime() / 1000),
      Math.floor(new Date('2024-10-10').getTime() / 1000),
      '6',
      'https://images.unsplash.com/photo-1578926280207-a90a5366759d?auto=format&fit=crop&w=800&q=80',
    ],
    [
      'exh-memory-archive',
      'Memory and Archive',
      'Multiple Artists',
      'How artists preserve, distort, and reimagine historical narrative.',
      Math.floor(new Date('2024-04-01').getTime() / 1000),
      Math.floor(new Date('2024-10-31').getTime() / 1000),
      '2',
      'https://images.unsplash.com/photo-1577720643272-265dc7a0922b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    ],
    [
      'exh-street-muralism',
      'Street to Gallery: Urban Art Ascendant',
      'Multiple Artists',
      'From alleyways to museum walls: the evolution of street art.',
      Math.floor(new Date('2024-04-10').getTime() / 1000),
      Math.floor(new Date('2024-11-15').getTime() / 1000),
      '7',
      'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=800&q=80',
    ],
    [
      'exh-sound-art-silence',
      'Sound and Silence',
      'Multiple Media Artists',
      'Auditory experiences, ambient soundscapes, and the art of listening.',
      Math.floor(new Date('2024-05-15').getTime() / 1000),
      Math.floor(new Date('2024-12-05').getTime() / 1000),
      '5',
      'https://images.unsplash.com/photo-1578926340990-eabf1f2e1f6e?auto=format&fit=crop&w=800&q=80',
    ],
    [
      'exh-nature-culture',
      'Nature and Culture',
      'Multiple Artists',
      'The intersection of natural forces and human intervention.',
      Math.floor(new Date('2024-06-01').getTime() / 1000),
      Math.floor(new Date('2025-01-20').getTime() / 1000),
      '3',
      'https://images.unsplash.com/photo-1577983345159-f03fdd239352?auto=format&fit=crop&w=800&q=80',
    ],
  ].forEach(row => exhibitionInsert.run(...row));

  // Artworks (in exhibitions)
  const artworkInsert = db.prepare(
    'INSERT OR IGNORE INTO artworks (id, exhibition_id, title, artist, medium, year, dimensions, image_url) VALUES (?,?,?,?,?,?,?,?)'
  );
  [
    ['artwork-lange-1', 'exh-dorothea-lange', 'Migrant Mother', 'Dorothea Lange', 'Gelatin silver print', 1936, '9.75" × 7.625"', 'https://images.unsplash.com/photo-1577720643272-265dc7a0922b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'],
    ['artwork-lange-2', 'exh-dorothea-lange', 'American Exodus', 'Dorothea Lange', 'Gelatin silver print', 1939, '10" × 8"', 'https://images.unsplash.com/photo-1579783902614-e3fb5141b0cb?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'],
    ['artwork-monet-1', 'exh-impressionist', 'Water Lilies', 'Claude Monet', 'Oil on canvas', 1906, '79.9" × 79.9"', 'https://images.unsplash.com/photo-1577720643272-265dc7a0922b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'],
    ['artwork-renoir-1', 'exh-impressionist', 'Luncheon of the Boating Party', 'Pierre-Auguste Renoir', 'Oil on canvas', 1880, '51.2" × 68"', 'https://images.unsplash.com/photo-1578301978162-7aae4d755744?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'],
    ['artwork-renaissance-1', 'exh-renaissance-reframed', 'Study of Drapery', 'Workshop of Verrocchio', 'Tempera on panel', 1475, '24" × 18"', 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?auto=format&fit=crop&w=800&q=80'],
    ['artwork-abstract-1', 'exh-abstract-dialogues', 'Chromatic Pulse', 'Elena Markov', 'Acrylic on canvas', 1964, '40" × 60"', 'https://images.unsplash.com/photo-1577083165633-14ebcdb0f658?auto=format&fit=crop&w=800&q=80'],
    ['artwork-sculpture-1', 'exh-sculpture-light', 'Bronze Helix', 'Marco Vidal', 'Bronze', 1998, '72" × 24" × 24"', 'https://images.unsplash.com/photo-1473447198193-cd2ec8c8cda7?auto=format&fit=crop&w=800&q=80'],
    ['artwork-africa-1', 'exh-modern-africa', 'Market at Dawn', 'Ayo Okafor', 'Oil on linen', 1974, '36" × 48"', 'https://images.unsplash.com/photo-1518991791750-7494e7ff7e76?auto=format&fit=crop&w=800&q=80'],
    ['artwork-design-1', 'exh-design-century', 'Modular Chair Prototype', 'Klara Weiss', 'Wood and steel', 1956, '34" × 22" × 24"', 'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&w=800&q=80'],
    ['artwork-city-1', 'exh-city-photography', 'Midnight Crossing', 'Luis Ortega', 'Digital print', 2013, '30" × 45"', 'https://images.unsplash.com/photo-1504196606672-aef5c9cefc92?auto=format&fit=crop&w=800&q=80'],
    ['artwork-newmedia-1', 'exh-new-media-lab', 'Signal Bloom', 'Rina Cao', 'Interactive LED installation', 2022, 'Variable', 'https://images.unsplash.com/photo-1518779578993-ec3579fee39f?auto=format&fit=crop&w=800&q=80'],
    ['artwork-ceramics-1', 'exh-ceramics-earth', 'Vessel Series IV', 'Nadia Kline', 'Stoneware', 2019, '18" × 12"', 'https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=800&q=80'],
    ['artwork-baroque-1', 'exh-baroque-returns', 'Ecstasy of Saint Teresa', 'Baroque Master', 'Oil on canvas', 1680, '48" × 60"', 'https://images.unsplash.com/photo-1578926314433-c6db0bd1f9ae?auto=format&fit=crop&w=800&q=80'],
    ['artwork-baroque-2', 'exh-baroque-returns', 'The Triumph of Bacchus', 'Baroque Painter', 'Oil on canvas', 1650, '56" × 72"', 'https://images.unsplash.com/photo-1578926280207-a90a5366759d?auto=format&fit=crop&w=800&q=80'],
    ['artwork-minimalism-1', 'exh-minimalism-maximalism', 'Untitled (Silence)', 'Agnes Martin', 'Acrylic and pencil', 1965, '72" × 72"', 'https://images.unsplash.com/photo-1577083165633-14ebcdb0f658?auto=format&fit=crop&w=800&q=80'],
    ['artwork-minimalism-2', 'exh-minimalism-maximalism', 'Black and White', 'Ellsworth Kelly', 'Oil on canvas', 1959, '60" × 80"', 'https://images.unsplash.com/photo-1577720643272-265dc7a0922b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'],
    ['artwork-feminist-1', 'exh-feminist-perspectives', 'The Dinner Party', 'Judy Chicago', 'Mixed media installation', 1979, '576" × 576"', 'https://images.unsplash.com/photo-1579783902614-e3fb5141b0cb?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'],
    ['artwork-feminist-2', 'exh-feminist-perspectives', 'Untitled Film Stills', 'Cindy Sherman', 'Photograph', 1978, '10" × 8"', 'https://images.unsplash.com/photo-1504196606672-aef5c9cefc92?auto=format&fit=crop&w=800&q=80'],
    ['artwork-textile-1', 'exh-global-textiles', 'Indigo Cloth from Mali', 'Master Weaver', 'Woven cotton', 1985, '72" × 36"', 'https://images.unsplash.com/photo-1451188089933-7621c3f78e4d?auto=format&fit=crop&w=800&q=80'],
    ['artwork-textile-2', 'exh-global-textiles', 'Kimono Fragment', 'Japanese Artisan', 'Silk and brocade', 1880, '48" × 24"', 'https://images.unsplash.com/photo-1527682662010-c3131bc70816?auto=format&fit=crop&w=800&q=80'],
    ['artwork-surreal-1', 'exh-surrealism-dreams', 'The Persistence of Memory', 'Salvador Dalí', 'Oil on canvas', 1931, '24.5" × 33"', 'https://images.unsplash.com/photo-1577084630692-0d4a50a1abc5?auto=format&fit=crop&w=800&q=80'],
    ['artwork-surreal-2', 'exh-surrealism-dreams', 'Son of Man', 'René Magritte', 'Oil on canvas', 1964, '36.2" × 28.7"', 'https://images.unsplash.com/photo-1552820728-8ac41f1ce891?auto=format&fit=crop&w=800&q=80'],
    ['artwork-landart-1', 'exh-land-art-now', 'Spiral Jetty', 'Robert Smithson', 'Earth sculpture', 1970, '1500" diameter', 'https://images.unsplash.com/photo-1577720643272-265dc7a0922b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'],
    ['artwork-landart-2', 'exh-land-art-now', 'Walking Line', 'Richard Long', 'Color photograph of walks', 2005, '40" × 50"', 'https://images.unsplash.com/photo-1577983345159-f03fdd239352?auto=format&fit=crop&w=800&q=80'],
    ['artwork-classical-1', 'exh-classical-revisited', 'Marble Echo', 'Contemporary Sculptor', 'White marble', 2018, '60" × 24" × 24"', 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=800&q=80'],
    ['artwork-color-1', 'exh-color-theory', 'Color Field No. 3', 'Mark Rothko', 'Oil on canvas', 1958, '96" × 108"', 'https://images.unsplash.com/photo-1578926340990-eabf1f2e1f6e?auto=format&fit=crop&w=800&q=80'],
    ['artwork-identity-1', 'exh-identity-migration', 'Two Worlds', 'Migration Artist', 'Mixed media', 2010, '48" × 60"', 'https://images.unsplash.com/photo-1579783902195-4a6b6e5bbc2e?auto=format&fit=crop&w=800&q=80'],
    ['artwork-popart-1', 'exh-pop-art-legacy', 'Campbell\'s Soup Cans', 'Andy Warhol', 'Silkscreen on canvas', 1962, 'Varies', 'https://images.unsplash.com/photo-1556740738-b6a63e27c4df?auto=format&fit=crop&w=800&q=80'],
    ['artwork-kinetic-1', 'exh-kinetic-motion', 'Motor Light', 'Julio Le Parc', 'Aluminum and motor', 1965, '36" × 36" × 24"', 'https://images.unsplash.com/photo-1578926280207-a90a5366759d?auto=format&fit=crop&w=800&q=80'],
    ['artwork-memory-1', 'exh-memory-archive', 'Fragments of History', 'Archival Artist', 'Collage and text', 2015, '72" × 48"', 'https://images.unsplash.com/photo-1577720643272-265dc7a0922b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'],
    ['artwork-street-1', 'exh-street-muralism', 'Urban Canvas', 'Street Artist Collective', 'Spray paint on wall', 2019, '200" × 150"', 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=800&q=80'],
    ['artwork-sound-1', 'exh-sound-art-silence', 'Listening Room', 'Sound Installation', 'Audio and space', 2018, 'Site specific', 'https://images.unsplash.com/photo-1578926340990-eabf1f2e1f6e?auto=format&fit=crop&w=800&q=80'],
    ['artwork-nature-1', 'exh-nature-culture', 'Forest Dialogue', 'Environmental Artist', 'Photography and wood', 2020, '60" × 48"', 'https://images.unsplash.com/photo-1577983345159-f03fdd239352?auto=format&fit=crop&w=800&q=80'],
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
    [
      'coll-renaissance-masters',
      'Renaissance Masterworks',
      'Iconic paintings and sculptures from the Italian Renaissance, celebrating the rebirth of classical learning.',
      'paintings',
      1400,
      1600,
      'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?auto=format&fit=crop&w=800&q=80',
    ],
    [
      'coll-baroque-drama',
      'Baroque and Drama',
      'Opulent, emotional, and theatrical works from the Baroque period across Europe.',
      'paintings',
      1600,
      1750,
      'https://images.unsplash.com/photo-1578926314433-c6db0bd1f9ae?auto=format&fit=crop&w=800&q=80',
    ],
    [
      'coll-romantic-era',
      'Romantic Era',
      'Emotion, nature, and individualism expressed through landscape and narrative painting.',
      'paintings',
      1800,
      1850,
      'https://images.unsplash.com/photo-1577783902614-e3fb5141b0cb?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    ],
    [
      'coll-modern-abstraction',
      'Modern Abstraction',
      'Non-representational works exploring color, form, and gesture in the 20th century.',
      'paintings',
      1900,
      1975,
      'https://images.unsplash.com/photo-1577720643272-265dc7a0922b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    ],
    [
      'coll-asian-art',
      'Asian Art and Traditions',
      'Paintings, sculpture, and objects from Chinese, Japanese, Indian, and Southeast Asian traditions.',
      'asian',
      800,
      2000,
      'https://images.unsplash.com/photo-1451188089933-7621c3f78e4d?auto=format&fit=crop&w=800&q=80',
    ],
    [
      'coll-medieval-period',
      'Medieval Period',
      'Religious and secular works from the Middle Ages, including illuminated manuscripts and panel paintings.',
      'paintings',
      500,
      1400,
      'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=800&q=80',
    ],
    [
      'coll-textiles-fiber',
      'Textiles and Fiber Arts',
      'Woven, embroidered, and dyed textiles from cultures around the world.',
      'textiles',
      1200,
      2024,
      'https://images.unsplash.com/photo-1451188089933-7621c3f78e4d?auto=format&fit=crop&w=800&q=80',
    ],
    [
      'coll-glass-vessels',
      'Glass and Vessels',
      'Delicate and masterful objects in glass from Roman cameos to contemporary vessels.',
      'glass',
      1,
      2024,
      'https://images.unsplash.com/photo-1578926340990-eabf1f2e1f6e?auto=format&fit=crop&w=800&q=80',
    ],
    [
      'coll-metalwork-jewelry',
      'Metalwork and Jewelry',
      'Precious and base metal objects: brooches, vessels, armor, and decorative ware.',
      'metalwork',
      1000,
      2024,
      'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=800&q=80',
    ],
    [
      'coll-landscape-photography',
      'Landscape Photography',
      'From Ansel Adams to contemporary practitioners: nature captured through the lens.',
      'photography',
      1850,
      2024,
      'https://images.unsplash.com/photo-1504196606672-aef5c9cefc92?auto=format&fit=crop&w=800&q=80',
    ],
    [
      'coll-video-film-art',
      'Video and Film Art',
      'Experimental and narrative video works exploring time, memory, and perception.',
      'video',
      1960,
      2024,
      'https://images.unsplash.com/photo-1516035069371-29a08e8be310?auto=format&fit=crop&w=800&q=80',
    ],
    [
      'coll-pop-movement',
      'Pop Movement Legacy',
      'Iconic works from Warhol, Lichtenstein, and contemporaries reimagining mass culture as art.',
      'paintings',
      1950,
      1975,
      'https://images.unsplash.com/photo-1556740738-b6a63e27c4df?auto=format&fit=crop&w=800&q=80',
    ],
    [
      'coll-urban-street-art',
      'Urban and Street Art',
      'From graffiti to gallery: the evolution of street culture as fine art.',
      'urban',
      1970,
      2024,
      'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=800&q=80',
    ],
    [
      'coll-feminist-art',
      'Feminist Art',
      'Works by and about women exploring identity, power, and representation.',
      'contemporary',
      1970,
      2024,
      'https://images.unsplash.com/photo-1579783902614-e3fb5141b0cb?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    ],
    [
      'coll-nature-culture-eco',
      'Nature and Culture: Eco-Art',
      'Contemporary artists engaging landscape, ecology, and environmental consciousness.',
      'contemporary',
      1970,
      2024,
      'https://images.unsplash.com/photo-1577984630692-0d4a50a1abc5?auto=format&fit=crop&w=800&q=80',
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
  const seedMessages = [
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
    ['Lucia Silva', 'lucia@example.com', 'Workshop Inquiry', 'Do you offer artist workshops or masterclasses?'],
    ['Raja Singh', 'raja@example.com', 'Facility Rental', 'I\'d like to inquire about renting the gallery for an event.'],
    ['Rosa Garcia', 'rosa@example.com', 'Donation Question', 'How can I donate artwork to the museum collection?'],
    ['Chen Wei', 'chen@example.com', 'Membership Promotion', 'Are there student membership discounts available?'],
    ['Priya Kumari', 'priya@example.com', 'Accessibility Needs', 'What accessibility accommodations are available?'],
    ['Thomas Mueller', 'thomas@example.com', 'Exhibit Feedback', 'I loved the current Impressionist exhibition.'],
    ['Aisha Williams', 'aisha@example.com', 'Research Access', 'Can I access the archives for my thesis research?'],
    ['Marco Benelli', 'marco@example.com', 'Summer Camp', 'Is there a summer art camp for teenagers?'],
    ['Yuki Tanaka', 'yuki@example.com', 'Opening Hours', 'Are you open on holiday Mondays?'],
    ['Sophie Laurent', 'sophie@example.com', 'Special Exhibitions', 'When will the next major exhibition open?'],
    ['James O\'Neill', 'james@example.com', 'Virtual Tours', 'Do you offer virtual exhibition tours online?'],
    ['Fatima Khalid', 'fatima@example.com', 'Program Inquiry', 'Are there evening programs for working adults?'],
  ];
  if (messageCount < seedMessages.length) {
    const insertMessage = db.prepare(
      `INSERT INTO contact_messages (name, email, subject, message, created_at)
       VALUES (?, ?, ?, ?, ?)`
    );
    const now = Math.floor(Date.now() / 1000);
    seedMessages.slice(messageCount).forEach((row, index) => {
      insertMessage.run(...row, now - (messageCount + index) * 3600);
    });
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
    ['subscriber11@example.com', 'Isabella Chen'],
    ['subscriber12@example.com', 'Liam Murphy'],
    ['subscriber13@example.com', 'Sophia Rodriguez'],
    ['subscriber14@example.com', 'Noah Patel'],
    ['subscriber15@example.com', 'Emma Wilson'],
    ['subscriber16@example.com', 'Oliver Martinez'],
    ['subscriber17@example.com', 'Ava Thompson'],
    ['subscriber18@example.com', 'Lucas Anderson'],
    ['subscriber19@example.com', 'Mia Jackson'],
    ['subscriber20@example.com', 'Ethan Taylor'],
    ['subscriber21@example.com', 'Charlotte White'],
    ['subscriber22@example.com', 'Aiden Harris'],
  ].forEach((row) => subscriberInsert.run(...row));
};

module.exports = { getDb, closeDb };
