import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, phone, province, city, district, address, shippingNote } = body

    if (!userId || !phone || !province || !city || !district || !address) {
      return NextResponse.json(
        { error: '请填写所有必填项' },
        { status: 400 }
      )
    }

    await query(
      `UPDATE users 
       SET phone = $1, province = $2, city = $3, district = $4, 
           address = $5, shipping_note = $6, updated_at = CURRENT_TIMESTAMP
       WHERE id = $7`,
      [phone, province, city, district, address, shippingNote, userId]
    )

    return NextResponse.json({ 
      success: true,
      message: '地址保存成功'
    })
  } catch (error) {
    console.error('Error saving address:', error)
    return NextResponse.json(
      { error: 'Failed to save address' },
      { status: 500 }
    )
  }
}
