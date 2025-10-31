import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { Department } from '@/types'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const description = searchParams.get('description')
    
    let queryStr = 'SELECT * FROM departments'
    const params = []
    
    if (description) {
      queryStr += ' WHERE description = $1'
      params.push(description)
    }
    
    queryStr += ' ORDER BY id'
    
    const result = await query(queryStr, params)
    return NextResponse.json({ departments: result.rows as Department[] })
  } catch (error) {
    console.error('Error fetching departments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch departments' },
      { status: 500 }
    )
  }
}
