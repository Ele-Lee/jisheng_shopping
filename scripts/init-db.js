const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const connectionString = 'postgresql://postgres:123456@8.148.207.39:5432/postgres';

async function initDatabase() {
  const client = new Client({ connectionString });

  try {
    await client.connect();
    console.log('Connected to PostgreSQL database');

    const sqlPath = path.join(__dirname, '../db/schema.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('Dropping existing tables...');
    await client.query('DROP TABLE IF EXISTS cart_items, users, products, departments CASCADE;');

    console.log('Creating tables...');
    await client.query(sql);

    console.log('Database initialization completed successfully!');
  } catch (error) {
    console.error('Database initialization failed:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

initDatabase();
