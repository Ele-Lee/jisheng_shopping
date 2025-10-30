const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://10273610@localhost:5432/postgres',
});

async function recreateProductsTable() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    console.log('删除现有 products 表...');
    await client.query('DROP TABLE IF EXISTS products CASCADE');

    console.log('创建新的 products 表...');
    await client.query(`
      CREATE TABLE products (
        id SERIAL PRIMARY KEY,
        category VARCHAR(50),
        brand VARCHAR(100),
        name VARCHAR(255) NOT NULL,
        specification TEXT,
        package_quantity INTEGER DEFAULT 1,
        shipping_from VARCHAR(100),
        courier_name VARCHAR(100),
        shipping_restrictions TEXT,
        market_price VARCHAR(50),
        jd_link TEXT,
        features TEXT,
        product_code VARCHAR(50),
        image VARCHAR(255),
        stock INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query('COMMIT');
    console.log('✓ Products 表重建完成！');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('重建表失败:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

recreateProductsTable().catch(err => {
  console.error(err);
  process.exit(1);
});
