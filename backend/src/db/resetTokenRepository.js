'use strict';

const { getDb } = require('./database');

/**
 * Remove all expired or already-used tokens.
 * Called before inserting a new token or verifying an incoming one.
 */
const removeExpired = () => {
  const now = Date.now();
  getDb()
    .prepare('DELETE FROM password_reset_tokens WHERE expires_at <= ? OR used_at IS NOT NULL')
    .run(now);
};

/**
 * Invalidate all active tokens for a given user (used before issuing a new one
 * and after a successful password reset).
 */
const invalidateForUser = (userId) => {
  getDb()
    .prepare('DELETE FROM password_reset_tokens WHERE user_id = ?')
    .run(userId);
};

/**
 * Persist a new reset-token record.
 */
const create = ({ userId, tokenHash, expiresAt }) => {
  getDb()
    .prepare(
      'INSERT INTO password_reset_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)'
    )
    .run(userId, tokenHash, expiresAt);
};

/**
 * Look up a valid (non-expired, non-used) token by its hash.
 * Returns the row or undefined.
 */
const findValid = (tokenHash) => {
  const now = Date.now();
  return getDb()
    .prepare(
      `SELECT * FROM password_reset_tokens
       WHERE token_hash = ? AND expires_at > ? AND used_at IS NULL`
    )
    .get(tokenHash, now);
};

/**
 * Mark a token as consumed so it cannot be reused.
 */
const markUsed = (tokenHash) => {
  getDb()
    .prepare('UPDATE password_reset_tokens SET used_at = ? WHERE token_hash = ?')
    .run(Date.now(), tokenHash);
};

module.exports = { removeExpired, invalidateForUser, create, findValid, markUsed };
