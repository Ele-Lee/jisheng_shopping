import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId')
    const phone = searchParams.get('phone')
    const province = searchParams.get('province')
    const city = searchParams.get('city')
    const district = searchParams.get('district')
    const address = searchParams.get('address')
    const shippingNote = searchParams.get('shippingNote')

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
      [phone, province, city, district, address, shippingNote || '', userId]
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
