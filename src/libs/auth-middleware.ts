import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/src/libs/prisma'
import { extractTokenFromRequest, verifyAccessToken, isJwtExpired, isJwtInvalid, type AccessPayload } from '@/src/libs/jwt'

export type AuthenticatedUser = { id: string; username: string; email: string; tokenVersion: number; createdAt: Date; updatedAt: Date }
export type AuthContext = { user: AuthenticatedUser; payload: AccessPayload }

// Overload: STATIC (tanpa params)
export function withAuth(
  handler: (req: NextRequest, ctx: AuthContext) => Promise<NextResponse> | NextResponse
): (req: NextRequest) => Promise<NextResponse>

// Overload: DYNAMIC (params sebagai Promise<TParams>)
export function withAuth<TParams extends Record<string, any>>(
  handler: (req: NextRequest, ctx: AuthContext & { params: TParams }) => Promise<NextResponse> | NextResponse
): (req: NextRequest, ctx: { params: Promise<TParams> }) => Promise<NextResponse>

// Implementasi tunggal
export function withAuth(handler: any) {
  return async (req: NextRequest, ctx?: { params?: any }) => {
    // --- auth dulu ---
    const token = extractTokenFromRequest(req)
    if (!token) return NextResponse.json({ message: 'Access token required', code: 'TOKEN_MISSING' }, { status: 401 })

    let payload: AccessPayload
    try {
      payload = verifyAccessToken(token)
    } catch (e) {
      if (isJwtExpired(e))  return NextResponse.json({ message: 'Access token has expired', code: 'TOKEN_EXPIRED' }, { status: 401 })
      if (isJwtInvalid(e))  return NextResponse.json({ message: 'Invalid access token', code: 'TOKEN_INVALID' }, { status: 401 })
      return NextResponse.json({ message: 'Authentication failed', code: 'AUTH_FAILED' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({ where: { id: payload.userId } })
    if (!user) return NextResponse.json({ message: 'User not found', code: 'USER_NOT_FOUND' }, { status: 404 })

    // --- resolve params bila ada & berupa Promise ---
    let resolvedParams: any = undefined
    if (ctx && 'params' in ctx) {
      const p = (ctx as any).params
      resolvedParams = (p && typeof p.then === 'function') ? await p : p
    }

    const authCtx = resolvedParams !== undefined
      ? ({ params: resolvedParams, user: user as AuthenticatedUser, payload })
      : ({ user: user as AuthenticatedUser, payload })

    return handler(req, authCtx)
  }
}
