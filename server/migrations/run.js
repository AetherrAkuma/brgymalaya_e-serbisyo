/**
 * Run the 001_audit_schema_upgrade migration against the live database.
 * Usage: node server/migrations/run.js
 */
const fs = require('fs');
const path = require('path');
const db = require('../config/db');

async function run() {
  console.log('Running migration: 001_audit_schema_upgrade...\n');

  const sql = fs.readFileSync(path.join(__dirname, '001_audit_schema_upgrade.sql'), 'utf8');

  // Split by semicolons and filter empty statements
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  for (const stmt of statements) {
    try {
      await db.query(stmt);
      console.log(`  ✓ ${stmt.slice(0, 80)}...`);
    } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME') {
        console.log(`  - Column already exists, skipping: ${stmt.slice(0, 60)}...`);
      } else if (err.code === 'ER_DUP_KEYNAME') {
        console.log(`  - Index already exists, skipping: ${stmt.slice(0, 60)}...`);
      } else {
        console.error(`  ✗ ${err.message}`);
      }
    }
  }

  console.log('\nMigration complete.');
  process.exit(0);
}

run().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
