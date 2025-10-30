import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

interface CartItemInput {
  productId: number
  quantity: number
  price: number
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId')
    const cartItemsStr = searchParams.get('cartItems')
    const totalPoints = searchParams.get('totalPoints')

    if (!userId || !cartItemsStr || !totalPoints) {
      return NextResponse.json(
        { error: 'userId, cartItems and totalPoints are required' },
        { status: 400 }
      )
    }

    const cartItems = JSON.parse(cartItemsStr) as CartItemInput[]

    if (cartItems.length === 0) {
      return NextResponse.json(
        { error: 'cartItems cannot be empty' },
        { status: 400 }
      )
    }

    await query('BEGIN')

    const userResult = await query('SELECT points FROM users WHERE id = $1', [userId])
    
    if (userResult.rows.length === 0) {
      await query('ROLLBACK')
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const currentPoints = userResult.rows[0].points

    if (currentPoints < parseInt(totalPoints)) {
      await query('ROLLBACK')
      return NextResponse.json({ error: '积分不足' }, { status: 400 })
    }

    const newPoints = currentPoints - parseInt(totalPoints)
    await query(
      'UPDATE users SET points = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [newPoints, userId]
    )

    for (const item of cartItems) {
      await query(
        `INSERT INTO cart_items (user_id, product_id, quantity)
         VALUES ($1, $2, $3)
         ON CONFLICT (user_id, product_id)
         DO UPDATE SET quantity = cart_items.quantity + $3, updated_at = CURRENT_TIMESTAMP`,
        [userId, item.productId, item.quantity]
      )
    }

    await query('COMMIT')

    return NextResponse.json({ 
      success: true,
      newPoints,
      message: '订单提交成功'
    })
  } catch (error) {
    await query('ROLLBACK')
    console.error('Error submitting order:', error)
    return NextResponse.json(
      { error: 'Failed to submit order' },
      { status: 500 }
    )
  }
}
