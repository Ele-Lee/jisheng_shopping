const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://10273610@localhost:5432/postgres',
});

async function addAddressFields() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    console.log('添加地址相关字段到 users 表...');
    
    await client.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS phone VARCHAR(20),
      ADD COLUMN IF NOT EXISTS province VARCHAR(50),
      ADD COLUMN IF NOT EXISTS city VARCHAR(50),
      ADD COLUMN IF NOT EXISTS district VARCHAR(50),
      ADD COLUMN IF NOT EXISTS address TEXT,
      ADD COLUMN IF NOT EXISTS shipping_note TEXT
    `);

    console.log('✓ 地址字段添加完成');

    await client.query('COMMIT');
    console.log('✓ 所有字段添加完成！');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('添加失败:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

addAddressFields().catch(err => {
  console.error(err);
  process.exit(1);
});
