import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { Product } from '@/types'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId' },
        { status: 400 }
      )
    }

    const userResult = await query(
      'SELECT u.department_id, d.name as department_name FROM users u JOIN departments d ON u.department_id = d.id WHERE u.id = $1',
      [userId]
    )

    if (userResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const departmentName = userResult.rows[0].department_name

    let productsQuery = 'SELECT * FROM products'
    
    if (['警航支队', '综管', '一大队', '二大队', '三大队'].includes(departmentName)) {
      productsQuery += ' WHERE stock >= 10'
    } else if (departmentName !== '局领导') {
      productsQuery += ' WHERE stock <= 10'
    }
    
    productsQuery += ' ORDER BY id'

    const result = await query(productsQuery)
    return NextResponse.json({ products: result.rows as Product[] })
  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    )
  }
}
