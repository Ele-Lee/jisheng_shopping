const { Pool } = require('pg');

const dataFile = process.argv[2] || 'products_100.ts';
let stock = 100;
if (dataFile.includes('23')) {
  stock = 0
}
const { midAutumnProducts } = require(`../data/${dataFile}`);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://10273610@localhost:5432/postgres',
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
    const priceFromFile = dataFile.match(/products_(\d+)\.ts/);
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
        'SELECT id FROM products WHERE name = $1 AND price = $2',
        [product.name, productPrice]
      );

      if (existing.rows.length === 0) {
        await client.query(
          `INSERT INTO products (
            price, category, brand, name, specification, 
            package_quantity, shipping_from, courier_name, 
            shipping_restrictions, market_price, jd_link, 
            features, product_code, image, stock
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
          [
            productPrice,
            product.category,
            product.brand,
            product.name,
            product.specification,
            parseQuantity(product.packageQuantity),
            product.shippingFrom,
            product.courierName,
            product.shippingRestrictions,
            product.marketPrice?.toString(),
            product.jdLink,
            typeof product.features === 'string' ? product.features : JSON.stringify(product.features),
            product.productCode,
            product.image,
            product.stock || stock
          ]
        );
      }
    }
    console.log(`✓ 导入了 ${midAutumnProducts.length} 个产品（价格: ${productPrice}积分）`);

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
