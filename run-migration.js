const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');

// Read the migration SQL
const migrationSQL = fs.readFileSync(path.join(__dirname, 'migrate-to-lists.sql'), 'utf8');

async function runMigration() {
  try {
    console.log('Connecting to database...');
    const sql = neon(process.env.DATABASE_URL);
    
    console.log('Running migration...');
    await sql(migrationSQL);
    
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigration();