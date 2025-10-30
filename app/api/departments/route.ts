import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { Department } from '@/types'

export async function GET() {
  try {
    const result = await query('SELECT * FROM departments ORDER BY id')
    return NextResponse.json({ departments: result.rows as Department[] })
  } catch (error) {
    console.error('Error fetching departments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch departments' },
      { status: 500 }
    )
  }
}
