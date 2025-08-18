import jwt, { JwtPayload, SignOptions } from 'jsonwebtoken'
import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'

const ACCESS_TOKEN_SECRET = process.env.JWT_SECRET
const REFRESH_TOKEN_SECRET = process.env.JWT_REFRESH_SECRET

// Helper: pastikan ENV ada
function ensure<T>(v: T, name: string): asserts v is NonNullable<T> {
  if (!v) throw new Error(`${name} is not set`)
}

// Helper: resolve expiresIn dari ENV → number detik (atau pakai string pola ms)
function resolveExpires(v: string | undefined, fallbackSec: number): SignOptions['expiresIn'] {
  if (!v) return fallbackSec
  const n = Number(v)
  return Number.isFinite(n) ? n : (v as unknown as SignOptions['expiresIn'])
}

const ACCESS_TOKEN_EXPIRES = resolveExpires(process.env.ACCESS_TOKEN_TTL, 60 * 15)          // 15 menit
const REFRESH_TOKEN_EXPIRES = resolveExpires(process.env.REFRESH_TOKEN_TTL, 60 * 60 * 24 * 7) // 7 hari

export type AccessPayload = { userId: string; username: string; email: string }
export type RefreshPayload = { userId: string; tokenVersion: number }

export function signAccessToken(payload: AccessPayload, opts: SignOptions = {}) {
  ensure(ACCESS_TOKEN_SECRET, 'JWT_SECRET')
  return jwt.sign(payload, ACCESS_TOKEN_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRES, ...opts })
}

export function signRefreshToken(payload: RefreshPayload, opts: SignOptions = {}) {
  ensure(REFRESH_TOKEN_SECRET, 'JWT_REFRESH_SECRET')
  return jwt.sign(payload, REFRESH_TOKEN_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRES, ...opts })
}

export function verifyAccessToken(token: string): JwtPayload & AccessPayload {
  ensure(ACCESS_TOKEN_SECRET, 'JWT_SECRET')
  return jwt.verify(token, ACCESS_TOKEN_SECRET) as JwtPayload & AccessPayload
}

export function verifyRefreshToken(token: string): JwtPayload & RefreshPayload {
  ensure(REFRESH_TOKEN_SECRET, 'JWT_REFRESH_SECRET')
  return jwt.verify(token, REFRESH_TOKEN_SECRET) as JwtPayload & RefreshPayload
}

export function extractTokenFromRequest(request: NextRequest): string | null {
  try {
    // Method 1: Authorization Header (Bearer token) - Most common
    const authHeader = request.headers.get('authorization')
    if (authHeader) {
      if (authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7).trim()
        if (token && token.length > 10) {
          return token
        }
      } else if (authHeader.length > 10) {
        // Authorization header without Bearer prefix
        return authHeader.trim()
      }
    }

    // Method 2: Cookie - accessToken (direct token storage)
    const accessTokenCookie = request.cookies.get('accessToken')
    if (accessTokenCookie?.value && accessTokenCookie.value.length > 10) {
      return accessTokenCookie.value
    }

    // Method 3: Cookie - session (token inside session data)
    const sessionCookie = request.cookies.get('session')
    if (sessionCookie?.value) {
      try {
        const sessionData = JSON.parse(sessionCookie.value)
        if (sessionData.accessToken && typeof sessionData.accessToken === 'string') {
          return sessionData.accessToken
        }
      } catch (error) {
        // Invalid session JSON, continue to next method
        console.warn('Invalid session cookie JSON:', error)
      }
    }

    // Method 4: Query parameter (useful for download links, webhooks, etc.)
    const url = new URL(request.url)
    const tokenParam = url.searchParams.get('token')
    if (tokenParam && tokenParam.length > 10) {
      return tokenParam
    }

    // Method 5: Custom header X-Access-Token
    const customTokenHeader = request.headers.get('x-access-token')
    if (customTokenHeader && customTokenHeader.length > 10) {
      return customTokenHeader
    }

    // Method 6: Custom header X-Auth-Token
    const authTokenHeader = request.headers.get('x-auth-token')
    if (authTokenHeader && authTokenHeader.length > 10) {
      return authTokenHeader
    }

    return null
  } catch (error) {
    console.error('Error extracting token from request:', error)
    return null
  }
}

export function extractAndVerifyToken(request: NextRequest): (JwtPayload & AccessPayload) | null {
  try {
    const token = extractTokenFromRequest(request)

    if (!token) {
      return null
    }

    const payload = verifyAccessToken(token)
    return payload
  } catch (error) {
    console.error('Token verification failed:', error)
    return null
  }
}

export function createAuthHeaders(token: string): HeadersInit {
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
}

export function isJwtExpired(err: unknown): boolean {
  return err instanceof jwt.TokenExpiredError
}
