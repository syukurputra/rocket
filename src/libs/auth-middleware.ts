import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/src/libs/prisma'
import {
  extractTokenFromRequest,
  verifyAccessToken,
  isJwtExpired,
  isJwtInvalid,
  type AccessPayload
} from '@/src/libs/jwt'

export type RouteContext = { params?: Record<string, string | string[]> }
export type AuthenticatedUser = {
  id: string; username: string; email: string; tokenVersion: number; createdAt: Date; updatedAt: Date
}
export type AuthContext = { user: AuthenticatedUser; payload: AccessPayload }

// ---------- OVERLOADS ----------
export function withAuth(
  handler: (req: NextRequest, ctx: AuthContext) => Promise<NextResponse> | NextResponse
): (req: NextRequest) => Promise<NextResponse>

export function withAuth<TParams extends Record<string, any>>(
  handler: (req: NextRequest, ctx: AuthContext & { params: TParams }) => Promise<NextResponse> | NextResponse
): (req: NextRequest, ctx: { params: TParams }) => Promise<NextResponse>

// ---------- IMPLEMENTATION (single) ----------
export function withAuth(handler: any) {
  return async (req: NextRequest, ctx?: RouteContext) => {
    try {
      const token = extractTokenFromRequest(req)
      if (!token) {
        return NextResponse.json({ message: 'Access token required', code: 'TOKEN_MISSING' }, { status: 401 })
      }

      let payload: AccessPayload
      try {
        payload = verifyAccessToken(token) // throw jika expired/invalid
      } catch (e) {
        if (isJwtExpired(e)) {
          return NextResponse.json({ message: 'Access token has expired', code: 'TOKEN_EXPIRED' }, { status: 401 })
        }
        if (isJwtInvalid(e)) {
          return NextResponse.json({ message: 'Invalid access token', code: 'TOKEN_INVALID' }, { status: 401 })
        }
        return NextResponse.json({ message: 'Authentication failed', code: 'AUTH_FAILED' }, { status: 401 })
      }

      const user = await prisma.user.findUnique({ where: { id: payload.userId } })
      if (!user) {
        return NextResponse.json({ message: 'User not found', code: 'USER_NOT_FOUND' }, { status: 404 })
      }

      const authCtx = ctx ? ({ ...ctx, user: user as AuthenticatedUser, payload }) : ({ user: user as AuthenticatedUser, payload })
      return handler(req, authCtx)
    } catch (err) {
      console.error('withAuth fatal error:', err)
      return NextResponse.json({ message: 'Internal server error', code: 'INTERNAL_ERROR' }, { status: 500 })
    }
  }
}
