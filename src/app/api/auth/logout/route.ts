import { NextRequest, NextResponse } from 'next/server'
// @ts-ignore
import { clearSessionCookies } from '../../../../../lib/session'

export async function POST(request: NextRequest) {
  try {
    const response = NextResponse.json({
      message: 'Logout successful'
    })

    // Clear session cookies
    clearSessionCookies(response)

    return response

  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
