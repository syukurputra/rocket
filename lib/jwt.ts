// @ts-ignore
import jwt from 'jsonwebtoken'
import { NextRequest } from 'next/server'

export interface JWTPayload {
  userId: string
  username: string
  email: string
  iat?: number
  exp?: number
}

export interface RefreshTokenPayload {
  userId: string
  tokenVersion: number
  iat?: number
  exp?: number
}

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production'
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key'

// Simple base64 encode/decode for tokens (replace with proper JWT library in production)
function base64UrlEncode(obj: any): string {
  return btoa(JSON.stringify(obj)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

function base64UrlDecode(str: string): any {
  str = str.replace(/-/g, '+').replace(/_/g, '/')
  while (str.length % 4) {
    str += '='
  }
  return JSON.parse(atob(str))
}

// Generate access token (short-lived, 15 minutes)
export function generateAccessToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
  const now = Math.floor(Date.now() / 1000)
  const tokenPayload = {
    ...payload,
    iat: now,
    exp: now + (15 * 60) // 15 minutes
  }

  const header = base64UrlEncode({ alg: 'HS256', typ: 'JWT' })
  const body = base64UrlEncode(tokenPayload)

  // Simple signature (use proper HMAC in production)
  const signature = base64UrlEncode({ secret: JWT_SECRET, header, body })

  return `${header}.${body}.${signature}`
}

// Generate refresh token (long-lived, 7 days)
export function generateRefreshToken(payload: Omit<RefreshTokenPayload, 'iat' | 'exp'>): string {
  const now = Math.floor(Date.now() / 1000)
  const tokenPayload = {
    ...payload,
    iat: now,
    exp: now + (7 * 24 * 60 * 60) // 7 days
  }

  const header = base64UrlEncode({ alg: 'HS256', typ: 'JWT' })
  const body = base64UrlEncode(tokenPayload)
  const signature = base64UrlEncode({ secret: JWT_REFRESH_SECRET, header, body })

  return `${header}.${body}.${signature}`
}

// Verify access token
export function verifyAccessToken(token: string): JWTPayload | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null

    const payload = base64UrlDecode(parts[1])
    const now = Math.floor(Date.now() / 1000)

    if (payload.exp < now) return null // Expired

    return payload as JWTPayload
  } catch (error) {
    return null
  }
}

// Extract token from request headers
export function extractTokenFromRequest(request: any): string | null {
  const authHeader = request.headers?.get('authorization') || request.headers?.authorization
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7)
  }
  return null
}
