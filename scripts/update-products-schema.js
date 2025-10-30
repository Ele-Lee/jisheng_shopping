const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://10273610@localhost:5432/postgres',
});

async function updateProductsSchema() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    console.log('添加 price 字段到 products 表...');
    await client.query(`
      ALTER TABLE products 
      ADD COLUMN IF NOT EXISTS price INTEGER DEFAULT 100
    `);

    console.log('更新所有产品价格为 100...');
    await client.query(`
      UPDATE products SET price = 100 WHERE price IS NULL
    `);

    await client.query('COMMIT');
    console.log('✓ Products 表更新完成！');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('更新失败:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

updateProductsSchema().catch(err => {
  console.error(err);
  process.exit(1);
});
