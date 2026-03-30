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
  `);
};

module.exports = { getDb, closeDb };
