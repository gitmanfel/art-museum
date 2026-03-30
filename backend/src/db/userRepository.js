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

module.exports = { findByEmail, findById, create, updatePassword };
