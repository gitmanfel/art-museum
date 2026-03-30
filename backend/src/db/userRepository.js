'use strict';

const { getDb } = require('./database');

/**
 * Find a user by email. Returns the row or undefined.
 */
const findByEmail = (email) => {
  return getDb()
    .prepare('SELECT * FROM users WHERE email = ?')
    .get(email);
};

/**
 * Find a user by their UUID. Returns the row or undefined.
 */
const findById = (id) => {
  return getDb()
    .prepare('SELECT * FROM users WHERE id = ?')
    .get(id);
};

/**
 * Insert a new user record. Returns the inserted row.
 */
const create = ({ id, email, password, role }) => {
  getDb()
    .prepare('INSERT INTO users (id, email, password, role) VALUES (?, ?, ?, ?)')
    .run(id, email, password, role);
  return findById(id);
};

/**
 * Update the hashed password for a user. Returns the updated row.
 */
const updatePassword = (id, hashedPassword) => {
  getDb()
    .prepare('UPDATE users SET password = ? WHERE id = ?')
    .run(hashedPassword, id);
  return findById(id);
};

/**
 * Update role for a user. Returns updated user row.
 */
const updateRole = (id, role) => {
  getDb()
    .prepare('UPDATE users SET role = ? WHERE id = ?')
    .run(role, id);
  return findById(id);
};

const listUsers = (limit = 50) => {
  return getDb()
    .prepare('SELECT id, email, role, created_at FROM users ORDER BY created_at DESC LIMIT ?')
    .all(limit);
};

const getUserCounts = () => {
  const totalUsers = getDb().prepare('SELECT COUNT(*) as count FROM users').get().count;
  const members = getDb().prepare("SELECT COUNT(*) as count FROM users WHERE role = 'member'").get().count;
  const admins = getDb().prepare("SELECT COUNT(*) as count FROM users WHERE role = 'admin'").get().count;
  return {
    totalUsers,
    members,
    admins,
  };
};

module.exports = { findByEmail, findById, create, updatePassword, updateRole, listUsers, getUserCounts };
