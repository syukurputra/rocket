import { NextRequest, NextResponse } from 'next/server'

const ACCESS_COOKIE = 'access_token'
const REFRESH_COOKIE = 'refresh_token'
const isProd = process.env.NODE_ENV === 'production'

const baseCookie = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: isProd,
  path: '/',
}

export function setSessionCookies(
  res: NextResponse,
  tokens: { accessToken: string; refreshToken: string },
  maxAge = { accessSec: 60 * 60 * 24, refreshSec: 60 * 60 * 24 * 7 } // 15m / 7d
) {
  res.cookies.set(ACCESS_COOKIE, tokens.accessToken, { ...baseCookie, maxAge: maxAge.accessSec })
  res.cookies.set(REFRESH_COOKIE, tokens.refreshToken, { ...baseCookie, maxAge: maxAge.refreshSec })
}

// ⬅️ ini yang dicari route logout
export function clearSessionCookies(res: NextResponse) {
  res.cookies.set(ACCESS_COOKIE, '', { ...baseCookie, maxAge: 0 })
  res.cookies.set(REFRESH_COOKIE, '', { ...baseCookie, maxAge: 0 })
}

// ⬅️ ini yang dicari route refresh
export function getRefreshTokenFromCookies(req: NextRequest): string | undefined {
  return req.cookies.get(REFRESH_COOKIE)?.value
}

export function getAccessTokenFromCookies(req: NextRequest): string | undefined {
  return req.cookies.get(ACCESS_COOKIE)?.value
}

// Untuk endpoint yang menerima Authorization: Bearer <token>
export function extractTokenFromRequest(req: NextRequest): string | null {
  const auth = req.headers.get('authorization')
  if (auth?.startsWith('Bearer ')) return auth.slice(7)
  return null
}
