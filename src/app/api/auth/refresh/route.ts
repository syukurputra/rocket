import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyRefreshToken, signAccessToken, signRefreshToken } from '@/lib/jwt'
import { getRefreshTokenFromCookies, setSessionCookies } from '@/lib/session'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const refreshToken = getRefreshTokenFromCookies(req)
    if (!refreshToken) {
      return NextResponse.json({ message: 'Refresh token not found' }, { status: 401 })
    }

    let payload: { userId: string; tokenVersion: number }
    try {
      payload = verifyRefreshToken(refreshToken) as { userId: string; tokenVersion: number }
    } catch {
      return NextResponse.json({ message: 'Invalid refresh token' }, { status: 401 })
    }

    // Pastikan user masih ada & tokenVersion cocok (belum di-revoke)
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, username: true, email: true, tokenVersion: true }
    })

    if (!user || user.tokenVersion !== payload.tokenVersion) {
      return NextResponse.json({ message: 'Invalid refresh token' }, { status: 401 })
    }

    // Buat access token baru + ROTASI refresh token
    const newAccessToken = signAccessToken({
      userId: user.id,
      username: user.username,
      email: user.email
    })
    const newRefreshToken = signRefreshToken({
      userId: user.id,
      tokenVersion: user.tokenVersion
    })

    const res = NextResponse.json(
      {
        message: 'Token refreshed successfully',
        accessToken: newAccessToken
      },
      { status: 200, headers: { 'Cache-Control': 'no-store' } }
    )

    // Set ulang cookies httpOnly
    setSessionCookies(res, { accessToken: newAccessToken, refreshToken: newRefreshToken })
    return res
  } catch (error) {
    console.error('Token refresh error:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
