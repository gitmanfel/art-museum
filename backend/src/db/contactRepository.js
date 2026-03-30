'use strict';

const { getDb } = require('./database');

const createMessage = ({ name, email, subject, message }) => {
  const db = getDb();
  const result = db
    .prepare(
      `INSERT INTO contact_messages (name, email, subject, message)
       VALUES (?, ?, ?, ?)`
    )
    .run(name, email, subject, message);

  return db
    .prepare('SELECT * FROM contact_messages WHERE id = ?')
    .get(result.lastInsertRowid);
};

const getMessageById = (id) => {
  return getDb().prepare('SELECT * FROM contact_messages WHERE id = ?').get(id);
};

const markMessageReplied = ({ id, repliedBy }) => {
  const db = getDb();
  db.prepare(
    `UPDATE contact_messages
     SET replied_at = unixepoch(), replied_by = ?
     WHERE id = ?`
  ).run(repliedBy, id);
  return getMessageById(id);
};

const upsertSubscriber = ({ email, fullName = null }) => {
  const db = getDb();
  db.prepare(
    `INSERT INTO newsletter_subscribers (email, full_name, is_active)
     VALUES (?, ?, 1)
     ON CONFLICT(email) DO UPDATE SET
       full_name = COALESCE(excluded.full_name, newsletter_subscribers.full_name),
       is_active = 1,
       updated_at = unixepoch()`
  ).run(email, fullName);

  return db
    .prepare('SELECT * FROM newsletter_subscribers WHERE email = ?')
    .get(email);
};

const listMessagesPaged = ({ page = 1, pageSize = 20, search = '' } = {}) => {
  const db = getDb();
  const safePage = Math.max(1, Number(page) || 1);
  const safePageSize = Math.max(1, Math.min(100, Number(pageSize) || 20));
  const offset = (safePage - 1) * safePageSize;

  const where = [];
  const params = [];
  if (search && String(search).trim()) {
    where.push('(name LIKE ? OR email LIKE ? OR subject LIKE ? OR message LIKE ?)');
    const term = `%${String(search).trim()}%`;
    params.push(term, term, term, term);
  }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const rows = db
    .prepare(
      `SELECT *
       FROM contact_messages
       ${whereSql}
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`
    )
    .all(...params, safePageSize, offset);

  const total = db
    .prepare(`SELECT COUNT(*) as count FROM contact_messages ${whereSql}`)
    .get(...params).count;

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

const listSubscribersPaged = ({ page = 1, pageSize = 20, search = '' } = {}) => {
  const db = getDb();
  const safePage = Math.max(1, Number(page) || 1);
  const safePageSize = Math.max(1, Math.min(100, Number(pageSize) || 20));
  const offset = (safePage - 1) * safePageSize;

  const where = [];
  const params = [];
  if (search && String(search).trim()) {
    where.push('(email LIKE ? OR full_name LIKE ?)');
    const term = `%${String(search).trim()}%`;
    params.push(term, term);
  }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const rows = db
    .prepare(
      `SELECT *
       FROM newsletter_subscribers
       ${whereSql}
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`
    )
    .all(...params, safePageSize, offset);

  const total = db
    .prepare(`SELECT COUNT(*) as count FROM newsletter_subscribers ${whereSql}`)
    .get(...params).count;

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

module.exports = {
  createMessage,
  getMessageById,
  markMessageReplied,
  upsertSubscriber,
  listMessagesPaged,
  listSubscribersPaged,
};
