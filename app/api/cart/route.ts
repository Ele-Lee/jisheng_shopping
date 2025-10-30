import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { CartItemWithProduct } from '@/types'

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
              p.id as product_id, p.name as product_name, p.description as product_description,
              p.price as product_price, p.image_url as product_image_url, p.stock as product_stock
       FROM cart_items ci
       JOIN products p ON ci.product_id = p.id
       WHERE ci.user_id = $1
       ORDER BY ci.created_at DESC`,
      [userId]
    )

    const cartItems = result.rows.map((row: any) => ({
      id: row.id,
      user_id: row.user_id,
      product_id: row.product_id,
      quantity: row.quantity,
      created_at: row.created_at,
      updated_at: row.updated_at,
      product: {
        id: row.product_id,
        name: row.product_name,
        description: row.product_description,
        price: parseFloat(row.product_price),
        image_url: row.product_image_url,
        stock: row.product_stock,
      }
    }))

    return NextResponse.json({ cartItems })
  } catch (error) {
    console.error('Error fetching cart:', error)
    return NextResponse.json(
      { error: 'Failed to fetch cart' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, productId, price } = body

    if (!userId || !productId || !price) {
      return NextResponse.json(
        { error: 'userId, productId, and price are required' },
        { status: 400 }
      )
    }

    const userResult = await query('SELECT points FROM users WHERE id = $1', [userId])
    
    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const currentPoints = userResult.rows[0].points

    if (currentPoints < price) {
      return NextResponse.json({ error: '积分不足' }, { status: 400 })
    }

    await query('BEGIN')

    const newPoints = currentPoints - price
    await query(
      'UPDATE users SET points = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [newPoints, userId]
    )

    const cartResult = await query(
      `INSERT INTO cart_items (user_id, product_id, quantity)
       VALUES ($1, $2, 1)
       ON CONFLICT (user_id, product_id)
       DO UPDATE SET quantity = cart_items.quantity + 1, updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [userId, productId]
    )

    await query('COMMIT')

    return NextResponse.json({ 
      cartItem: cartResult.rows[0],
      newPoints 
    })
  } catch (error) {
    await query('ROLLBACK')
    console.error('Error adding to cart:', error)
    return NextResponse.json(
      { error: 'Failed to add to cart' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { cartItemId, quantity } = body

    if (!cartItemId || quantity === undefined) {
      return NextResponse.json(
        { error: 'cartItemId and quantity are required' },
        { status: 400 }
      )
    }

    if (quantity <= 0) {
      await query('DELETE FROM cart_items WHERE id = $1', [cartItemId])
      return NextResponse.json({ message: 'Item removed from cart' })
    }

    const result = await query(
      `UPDATE cart_items 
       SET quantity = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [quantity, cartItemId]
    )

    return NextResponse.json({ cartItem: result.rows[0] })
  } catch (error) {
    console.error('Error updating cart:', error)
    return NextResponse.json(
      { error: 'Failed to update cart' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const cartItemId = request.nextUrl.searchParams.get('cartItemId')

    if (!cartItemId) {
      return NextResponse.json(
        { error: 'cartItemId is required' },
        { status: 400 }
      )
    }

    await query('DELETE FROM cart_items WHERE id = $1', [cartItemId])
    return NextResponse.json({ message: 'Item removed from cart' })
  } catch (error) {
    console.error('Error deleting cart item:', error)
    return NextResponse.json(
      { error: 'Failed to delete cart item' },
      { status: 500 }
    )
  }
}
