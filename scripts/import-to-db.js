const { Pool } = require('pg');
const { departments, userPointsSummary } = require('../data/duty-records_2.ts');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
  // connectionString: process.env.DATABASE_URL || 'postgresql://10273610@localhost:5432/postgres',
});

async function importData() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

//     console.log('清空现有数据...');
//     await client.query('TRUNCATE TABLE users CASCADE');
//     await client.query('TRUNCATE TABLE departments CASCADE');
//     await client.query('ALTER SEQUENCE departments_id_seq RESTART WITH 1');
//     await client.query('ALTER SEQUENCE users_id_seq RESTART WITH 1');
//     await client.query('COMMIT');
// return
    console.log('导入部门数据...');
    const deptIdMap = new Map();
    for (const dept of departments) {
      const result = await client.query(
        'INSERT INTO departments (name, description) VALUES ($1, $2) RETURNING id',
        [dept.name, '0']
      );
      deptIdMap.set(dept.id, result.rows[0].id);
    }
    console.log(`✓ 导入了 ${departments.length} 个部门`);

    console.log('导入用户数据...');
    for (const user of userPointsSummary) {
      const newDeptId = deptIdMap.get(user.部门id);
      await client.query(
        'INSERT INTO users (username, department_id, points, duty_count) VALUES ($1, $2, $3, $4)',
        [user.姓名, newDeptId, user.积分, user.值班次数]
      );
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
