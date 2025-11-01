require('dotenv').config({ path: '.env.local' })
const { Pool } = require('pg');

const dataFile = process.argv[2] || 'products_100.ts';
let stock = 100;
if (dataFile.includes('23')) {
  stock = 0
} else if (dataFile.includes('new')) {
  stock = 20
}
const { midAutumnProducts } = require(`../data/${dataFile}`);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function importProducts() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');


//     console.log('清空现有数据...');
//     await client.query('TRUNCATE TABLE products CASCADE');
//     await client.query('ALTER SEQUENCE products_id_seq RESTART WITH 1');
//     await client.query('COMMIT');
// return
    const priceFromFile = dataFile.replace('new_', '').match(/products_(\d+)\.ts/);
    let productPrice = priceFromFile ? parseInt(priceFromFile[1]) : 100;
    if (dataFile.includes('23')) {
      productPrice = 500
    }

    console.log(`导入 ${dataFile} 的产品数据（价格: ${productPrice}积分）...`);

    console.log('追加产品数据（不覆盖现有数据）...');
    for (const product of midAutumnProducts) {
      const parseQuantity = (val) => {
        if (typeof val === 'number') return val;
        if (typeof val === 'string') {
          const match = val.match(/\d+/);
          return match ? parseInt(match[0]) : 1;
        }
        return 1;
      };

      const existing = await client.query(
        'SELECT id FROM products WHERE name = $1 AND price = $2 AND stock = $3',
        [product.name, 100, stock]
      );
      // const existing = await client.query(
      //   'SELECT id FROM products WHERE name = $1 AND price = $2',
      //   [product.name, productPrice]
      // );

    // INSERT_YOUR_CODE
    // 把这些符合条件的existing的数据，改掉他们的price变成200
    if (existing.rows.length > 0) {
      // existing.rows是所有需要调整价格的产品id
      for (const row of existing.rows) {
        await client.query(
          'UPDATE products SET price = $2 WHERE id = $1',
          [row.id, productPrice]
        );
      }
    }
    }
    console.log(`✓ 改变了 ${midAutumnProducts.length} 个产品（价格: ${productPrice}积分）`);

    await client.query('COMMIT');
    console.log('\n产品数据导入完成！');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('导入失败:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

importProducts().catch(err => {
  console.error(err);
  process.exit(1);
});
