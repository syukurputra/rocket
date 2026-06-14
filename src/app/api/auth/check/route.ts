import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/src/libs/prisma'
import { verifyAccessToken, verifyRefreshToken, signAccessToken, signRefreshToken, isJwtExpired } from '@/src/libs/jwt'
import {
  extractTokenFromRequest,
  getAccessTokenFromCookies,
  getRefreshTokenFromCookies,
  setSessionCookies
} from '@/src/libs/session'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  try {
    const shouldRedirect = req.nextUrl.searchParams.get('redirect') === 'true'

    // 1) Try ACCESS TOKEN (header/cookie)
    const accessToken = extractTokenFromRequest(req) || getAccessTokenFromCookies(req)

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

        if (shouldRedirect) {
          return NextResponse.redirect(new URL('/login', req.url))
        }

        return NextResponse.json({ authenticated: false, message: 'User tidak ditemukan' }, { status: 401 })
      } catch (err) {
        if (!isJwtExpired(err)) {
          if (shouldRedirect) {
            return NextResponse.redirect(new URL('/login', req.url))
          }

          return NextResponse.json({ authenticated: false, message: 'Token akses tidak valid' }, { status: 401 })
        }
      }
    }

    // 2) Fallback: REFRESH TOKEN from cookie
    const rt = getRefreshTokenFromCookies(req)

    if (!rt) {
      if (shouldRedirect) {
        return NextResponse.redirect(new URL('/login', req.url))
      }

      return NextResponse.json({ authenticated: false, message: 'Token tidak ditemukan' }, { status: 401 })
    }

    let rp: { userId: string; tokenVersion: number }
    try {
      rp = verifyRefreshToken(rt) as { userId: string; tokenVersion: number }
    } catch {
      if (shouldRedirect) {
        return NextResponse.redirect(new URL('/login', req.url))
      }

      return NextResponse.json({ authenticated: false, message: 'Refresh token tidak valid' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: rp.userId },
      select: { id: true, username: true, email: true, createdAt: true, updatedAt: true, tokenVersion: true }
    })

    if (!user || user.tokenVersion !== rp.tokenVersion) {
      if (shouldRedirect) {
        return NextResponse.redirect(new URL('/login', req.url))
      }

      return NextResponse.json({ authenticated: false, message: 'Token sudah dicabut atau user tidak ditemukan' }, { status: 401 })
    }

    // 3) Rotate tokens & set new cookies
    const newAT = signAccessToken({ userId: user.id, username: user.username, email: user.email })
    const newRT = signRefreshToken({ userId: user.id, tokenVersion: user.tokenVersion })

    const res = NextResponse.json(
      { authenticated: true, source: 'refresh', user },
      { headers: { 'Cache-Control': 'no-store', Vary: 'Cookie' } }
    )
    setSessionCookies(res, { accessToken: newAT, refreshToken: newRT })

    return res
  } catch (err) {
    console.error('Auth check error:', err)

    const shouldRedirect = req.nextUrl.searchParams.get('redirect') === 'true'

    if (shouldRedirect) {
      return NextResponse.redirect(new URL('/login', req.url))
    }

    return NextResponse.json({ authenticated: false, message: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
