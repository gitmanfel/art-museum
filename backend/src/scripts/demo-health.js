'use strict';

const { getDb, closeDb } = require('../db/database');

const tableChecks = [
  ['ticket_types', 'Ticket Types'],
  ['products', 'Products'],
  ['exhibitions', 'Exhibitions'],
  ['collections', 'Collections'],
  ['artworks', 'Artworks'],
  ['contact_messages', 'Contact Messages'],
  ['newsletter_subscribers', 'Newsletter Subscribers'],
];

const expectedMinimums = {
  ticket_types: 20,
  products: 20,
  exhibitions: 20,
  collections: 20,
  artworks: 20,
  contact_messages: 20,
  newsletter_subscribers: 20,
};

try {
  const db = getDb();
  console.log('Museum Demo Health Check');
  console.log('========================');

  tableChecks.forEach(([tableName, label]) => {
    const row = db.prepare(`SELECT COUNT(*) AS count FROM ${tableName}`).get();
    const count = row.count;
    const status = count >= expectedMinimums[tableName] ? 'OK' : 'LOW';
    console.log(`${status.padEnd(3)} | ${label.padEnd(22)} | ${count}`);
  });

  closeDb();
} catch (error) {
  console.error('Health check failed:', error.message);
  process.exitCode = 1;
}
