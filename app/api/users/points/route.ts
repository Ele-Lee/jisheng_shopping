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
      'SELECT id, username, points FROM users WHERE id = $1',
      [userId]
    )

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ user: result.rows[0] })
  } catch (error) {
    console.error('Error fetching user points:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user points' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, points } = body

    if (!userId || points === undefined) {
      return NextResponse.json(
        { error: 'userId and points are required' },
        { status: 400 }
      )
    }

    if (points < 0) {
      return NextResponse.json(
        { error: 'Points cannot be negative' },
        { status: 400 }
      )
    }

    const result = await query(
      `UPDATE users 
       SET points = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING id, username, points`,
      [points, userId]
    )

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ user: result.rows[0] })
  } catch (error) {
    console.error('Error updating user points:', error)
    return NextResponse.json(
      { error: 'Failed to update user points' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, pointsDelta } = body

    if (!userId || pointsDelta === undefined) {
      return NextResponse.json(
        { error: 'userId and pointsDelta are required' },
        { status: 400 }
      )
    }

    const result = await query(
      `UPDATE users 
       SET points = points + $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING id, username, points`,
      [pointsDelta, userId]
    )

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    if (result.rows[0].points < 0) {
      await query(
        'UPDATE users SET points = 0 WHERE id = $1',
        [userId]
      )
      return NextResponse.json(
        { error: 'Insufficient points' },
        { status: 400 }
      )
    }

    return NextResponse.json({ user: result.rows[0] })
  } catch (error) {
    console.error('Error updating user points:', error)
    return NextResponse.json(
      { error: 'Failed to update user points' },
      { status: 500 }
    )
  }
}
