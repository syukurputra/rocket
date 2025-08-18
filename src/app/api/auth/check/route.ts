import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import {
  verifyAccessToken,
  verifyRefreshToken,
  signAccessToken,
  signRefreshToken,
  isJwtExpired, // tambahkan helper ini di lib/jwt
} from '@/lib/jwt'
import {
  extractTokenFromRequest,
  getAccessTokenFromCookies,
  getRefreshTokenFromCookies,
  setSessionCookies
} from '@/lib/session'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  try {
    // 1) Coba pakai ACCESS TOKEN (header/cookie)
    const accessToken =
      extractTokenFromRequest(req) ||
      getAccessTokenFromCookies(req)

    if (accessToken) {
      try {
        const p = verifyAccessToken(accessToken) as { userId: string }
        const user = await prisma.user.findUnique({
          where: { id: p.userId },
          select: { id: true, username: true, email: true, createdAt: true, updatedAt: true, tokenVersion: true }
        })
        if (user) {
          return NextResponse.json(
            { authenticated: true, source: 'access', user },
            { headers: { 'Cache-Control': 'no-store' } }
          )
        }
        // user tidak ada → jangan fallback ke refresh; treat as unauthorized
        return NextResponse.json(
          { authenticated: false, message: 'Unauthorized' },
          { status: 401 }
        )
      } catch (err) {
        // ⬇️ hanya fallback kalau access token EXPIRED
        if (!isJwtExpired(err)) {
          return NextResponse.json(
            { authenticated: false, message: 'Invalid access token' },
            { status: 401 }
          )
        }
        // else: lanjut ke refresh
      }
    }

    // 2) Fallback: REFRESH TOKEN dari cookie (untuk kasus expired)
    const rt = getRefreshTokenFromCookies(req)
    if (!rt) {
      return NextResponse.json(
        { authenticated: false, message: 'No token provided' },
        { status: 401 }
      )
    }

    let rp: { userId: string; tokenVersion: number }
    try {
      rp = verifyRefreshToken(rt) as { userId: string; tokenVersion: number }
    } catch {
      return NextResponse.json(
        { authenticated: false, message: 'Invalid refresh token' },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: rp.userId },
      select: { id: true, username: true, email: true, createdAt: true, updatedAt: true, tokenVersion: true }
    })
    if (!user || user.tokenVersion !== rp.tokenVersion) {
      return NextResponse.json(
        { authenticated: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    // 3) Rotasi token & set cookies baru
    const newAT = signAccessToken({ userId: user.id, username: user.username, email: user.email })
    const newRT = signRefreshToken({ userId: user.id, tokenVersion: user.tokenVersion })

    const res = NextResponse.json(
      { authenticated: true, source: 'refresh', user },
      { headers: { 'Cache-Control': 'no-store', 'Vary': 'Cookie' } }
    )
    setSessionCookies(res, { accessToken: newAT, refreshToken: newRT })
    return res
  } catch (err) {
    console.error('Auth check error:', err)
    return NextResponse.json(
      { authenticated: false, message: 'Server error' },
      { status: 500 }
    )
  }
}
