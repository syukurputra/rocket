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
    // Check if this is a redirect request (from browser navigation)
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

        // User not found → redirect or return 401
        if (shouldRedirect) {
          return NextResponse.redirect(new URL('/id/login', req.url))
        }

        return NextResponse.json({ authenticated: false, message: 'User not found' }, { status: 401 })
      } catch (err) {
        // Only fallback to refresh if access token is EXPIRED
        if (!isJwtExpired(err)) {
          if (shouldRedirect) {
            return NextResponse.redirect(new URL('/id/login', req.url))
          }

          return NextResponse.json({ authenticated: false, message: 'Invalid access token' }, { status: 401 })
        }
        // else: continue to refresh token check
      }
    }

    // 2) Fallback: REFRESH TOKEN from cookie
    const rt = getRefreshTokenFromCookies(req)

    if (!rt) {
      // No tokens at all → redirect to login immediately
      if (shouldRedirect) {
        return NextResponse.redirect(new URL('/id/login', req.url))
      }

      return NextResponse.json({ authenticated: false, message: 'No token provided' }, { status: 401 })
    }

    let rp: { userId: string; tokenVersion: number }
    try {
      rp = verifyRefreshToken(rt) as { userId: string; tokenVersion: number }
    } catch {
      // Invalid refresh token → redirect to login
      if (shouldRedirect) {
        return NextResponse.redirect(new URL('/id/login', req.url))
      }

      return NextResponse.json({ authenticated: false, message: 'Invalid refresh token' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: rp.userId },
      select: { id: true, username: true, email: true, createdAt: true, updatedAt: true, tokenVersion: true }
    })

    if (!user || user.tokenVersion !== rp.tokenVersion) {
      // Token version mismatch or user not found → redirect to login
      if (shouldRedirect) {
        return NextResponse.redirect(new URL('/id/login', req.url))
      }

      return NextResponse.json({ authenticated: false, message: 'Token revoked or user not found' }, { status: 401 })
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
      return NextResponse.redirect(new URL('/id/login', req.url))
    }

    return NextResponse.json({ authenticated: false, message: 'Server error' }, { status: 500 })
  }
}
