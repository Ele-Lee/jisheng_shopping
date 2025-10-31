const { Pool } = require('pg');
const { departments, userPointsSummary } = require('../data/duty-records_2.ts');

const pool = new Pool({
  // connectionString: process.env.DATABASE_URL || 'postgresql://10273610@localhost:5432/postgres',
});

async function importData() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    console.log('导入新部门数据...');
    for (const dept of departments) {
      await client.query(
        'INSERT INTO departments (id, name, description) VALUES ($1, $2, $3) ON CONFLICT (id) DO UPDATE SET name = $2, description = $3',
        [dept.id, dept.name, '1']
      );
    }
    console.log(`✓ 导入了 ${departments.length} 个部门`);

    console.log('导入新用户数据...');
    for (const user of userPointsSummary) {
      const existingUser = await client.query(
        'SELECT id FROM users WHERE username = $1 AND department_id = $2',
        [user.姓名, user.部门id]
      );
      
      if (existingUser.rows.length > 0) {
        await client.query(
          'UPDATE users SET points = $3, duty_count = $4 WHERE username = $1 AND department_id = $2',
          [user.姓名, user.部门id, user.积分, user.值班次数]
        );
      } else {
        await client.query(
          'INSERT INTO users (username, department_id, points, duty_count) VALUES ($1, $2, $3, $4)',
          [user.姓名, user.部门id, user.积分, user.值班次数]
        );
      }
    }
    console.log(`✓ 导入了 ${userPointsSummary.length} 个用户`);

    await client.query('COMMIT');
    console.log('\n数据导入完成！');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('导入失败:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

importData().catch(err => {
  console.error(err);
  process.exit(1);
});
