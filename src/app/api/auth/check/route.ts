import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')

    if (!token) {
      return NextResponse.json(
        { authenticated: false, message: 'No token provided' },
        { status: 401 }
      )
    }

    // Simple token validation - replace with real JWT verification
    if (token === 'mock-token-12345678901234567890' || token.length > 10) {
      return NextResponse.json({
        authenticated: true,
        user: {
          id: '1',
          username: 'user',
          email: 'user@example.com'
        }
      })
    }

    return NextResponse.json(
      { authenticated: false, message: 'Invalid token' },
      { status: 401 }
    )

  } catch (error) {
    console.error('Auth check error:', error)
    return NextResponse.json(
      { authenticated: false, message: 'Server error' },
      { status: 500 }
    )
  }
}
