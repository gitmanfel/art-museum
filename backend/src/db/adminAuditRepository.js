'use strict';

const { getDb } = require('./database');

const logAction = ({ actorUserId, actorEmail, action, entityType, entityId, before = null, after = null }) => {
  getDb()
    .prepare(
      `INSERT INTO admin_audit_logs (
        actor_user_id,
        actor_email,
        action,
        entity_type,
        entity_id,
        before_json,
        after_json,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, unixepoch())`
    )
    .run(
      actorUserId,
      actorEmail,
      action,
      entityType,
      entityId,
      before ? JSON.stringify(before) : null,
      after ? JSON.stringify(after) : null
    );
};

const listAuditLogs = ({ page = 1, pageSize = 20, search = '' } = {}) => {
  const db = getDb();
  const safePage = Math.max(1, Number(page) || 1);
  const safePageSize = Math.max(1, Math.min(100, Number(pageSize) || 20));
  const offset = (safePage - 1) * safePageSize;

  const where = [];
  const params = [];
  if (search && String(search).trim()) {
    where.push('(actor_email LIKE ? OR action LIKE ? OR entity_type LIKE ? OR entity_id LIKE ?)');
    const term = `%${String(search).trim()}%`;
    params.push(term, term, term, term);
  }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const rows = db
    .prepare(
      `SELECT *
       FROM admin_audit_logs
       ${whereSql}
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`
    )
    .all(...params, safePageSize, offset)
    .map((row) => ({
      ...row,
      before_json: row.before_json ? JSON.parse(row.before_json) : null,
      after_json: row.after_json ? JSON.parse(row.after_json) : null,
    }));

  const total = db
    .prepare(`SELECT COUNT(*) as count FROM admin_audit_logs ${whereSql}`)
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
  logAction,
  listAuditLogs,
};
