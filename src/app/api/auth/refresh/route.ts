import { NextRequest, NextResponse } from 'next/server'
import { verifyRefreshToken, generateAccessToken } from '../../../../../lib/jwt'
import { getRefreshTokenFromCookies } from '../../../../../lib/session'
import prisma from '../../../../../lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const refreshToken = getRefreshTokenFromCookies()

    if (!refreshToken) {
      return NextResponse.json(
        { message: 'Refresh token not found' },
        { status: 401 }
      )
    }

    const payload = verifyRefreshToken(refreshToken)

    if (!payload) {
      return NextResponse.json(
        { message: 'Invalid refresh token' },
        { status: 401 }
      )
    }

    // Verify user still exists and token version matches
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        username: true,
        email: true,
        tokenVersion: true
      }
    })

    if (!user || user.tokenVersion !== payload.tokenVersion) {
      return NextResponse.json(
        { message: 'Invalid refresh token' },
        { status: 401 }
      )
    }

    // Generate new access token
    const newAccessToken = generateAccessToken({
      userId: user.id,
      username: user.username,
      email: user.email
    })

    return NextResponse.json({
      message: 'Token refreshed successfully',
      accessToken: newAccessToken
    })

  } catch (error) {
    console.error('Token refresh error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
