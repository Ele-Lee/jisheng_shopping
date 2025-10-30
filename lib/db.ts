import { Pool } from 'pg'

let pool: Pool | null = null
console.log('%celelee test database url:', 'color:#fff;background:#000', process.env.DATABASE_URL)
export function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL || 'postgresql://postgres:123456@localhost:5432/postgres',
    })
  }
  return pool
}

export async function query(text: string, params?: any[]) {
  const pool = getPool()
  const result = await pool.query(text, params)
  return result
}
