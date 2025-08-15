import jwt, { JwtPayload, SignOptions } from 'jsonwebtoken'

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
