import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId')
    const recipient = searchParams.get('recipient')
    const phone = searchParams.get('phone')
    const province = searchParams.get('province')
    const city = searchParams.get('city')
    const district = searchParams.get('district')
    const address = searchParams.get('address')
    const shippingNote = searchParams.get('shippingNote')

    if (!userId || !recipient || !phone || !province || !city || !district || !address) {
      return NextResponse.json(
        { error: '请填写所有必填项' },
        { status: 400 }
      )
    }

    await query(
      `UPDATE users 
       SET recipient = $1, phone = $2, province = $3, city = $4, district = $5, 
           address = $6, shipping_note = $7, updated_at = CURRENT_TIMESTAMP
       WHERE id = $8`,
      [recipient, phone, province, city, district, address, shippingNote || '', userId]
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
