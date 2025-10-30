import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId')
    
    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      )
    }

    const result = await query(
      `SELECT ci.*, 
              p.id as product_id, 
              p.name as product_name, 
              p.brand as product_brand,
              p.category as product_category,
              p.specification as product_specification,
              p.price as product_price, 
              p.image as product_image,
              p.stock as product_stock
       FROM cart_items ci
       JOIN products p ON ci.product_id = p.id
       WHERE ci.user_id = $1
       ORDER BY ci.created_at DESC`,
      [userId]
    )

    const orderItems = result.rows.map((row: any) => ({
      id: row.id,
      user_id: row.user_id,
      product_id: row.product_id,
      quantity: row.quantity,
      created_at: row.created_at,
      updated_at: row.updated_at,
      product: {
        id: row.product_id,
        name: row.product_name,
        brand: row.product_brand,
        category: row.product_category,
        specification: row.product_specification,
        price: row.product_price,
        image: row.product_image,
        stock: row.product_stock,
      }
    }))

    return NextResponse.json({ orders: orderItems })
  } catch (error) {
    console.error('Error fetching orders:', error)
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    )
  }
}
