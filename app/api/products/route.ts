import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { Product } from '@/types'

export async function GET() {
  try {
    const result = await query('SELECT * FROM products ORDER BY id')
    return NextResponse.json({ products: result.rows as Product[] })
  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    )
  }
}
