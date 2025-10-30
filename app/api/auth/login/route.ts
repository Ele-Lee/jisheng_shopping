import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET(request: NextRequest) {
  console.log('Login GET request received')
  try {
    const searchParams = request.nextUrl.searchParams
    const username = searchParams.get('username')
    const departmentId = searchParams.get('departmentId')
    
    console.log('Request params:', { username, departmentId })

    if (!username || !departmentId) {
      console.log('Validation failed: missing username or departmentId')
      return NextResponse.json(
        { error: '请输入姓名并选择部门' },
        { status: 400 }
      )
    }

    const result = await query(
      'SELECT id, username, department_id, points, duty_count FROM users WHERE username = $1',
      [username]
    )

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: '用户不存在' },
        { status: 404 }
      )
    }

    const user = result.rows[0]

    if (user.department_id !== parseInt(departmentId)) {
      return NextResponse.json(
        { error: '部门选择错误' },
        { status: 401 }
      )
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        department_id: user.department_id,
        points: user.points,
        duty_count: user.duty_count
      }
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: '登录失败，请重试' },
      { status: 500 }
    )
  }
}
