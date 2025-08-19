import { NextRequest, NextResponse } from 'next/server'
import { verifyRefreshToken, signAccessToken, signRefreshToken } from '@/lib/jwt'
import prisma from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { refreshToken } = body

    if (!refreshToken) {
      return NextResponse.json(
        { error: 'Refresh token required' },
        { status: 400 }
      )
    }

    // Verify refresh token
    const payload = verifyRefreshToken(refreshToken)

    // Check if user exists and token version matches
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        username: true,
        email: true,
        tokenVersion: true
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 401 }
      )
    }

    // Check token version (to handle revoked tokens)
    if (user.tokenVersion !== payload.tokenVersion) {
      return NextResponse.json(
        { error: 'Token revoked' },
        { status: 401 }
      )
    }

    // Generate new access token
    const newAccessToken = signAccessToken({
      userId: user.id,
      username: user.username,
      email: user.email
    })

    // Optionally generate new refresh token (rotate refresh tokens)
    const newRefreshToken = signRefreshToken({
      userId: user.id,
      tokenVersion: user.tokenVersion
    })

    console.log('Token refresh successful for user:', user.username)

    return NextResponse.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      }
    })

  } catch (error) {
    console.error('Refresh token error:', error)
    return NextResponse.json(
      { error: 'Invalid refresh token' },
      { status: 401 }
    )
  }
}
