import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/src/libs/prisma'
import {
  extractTokenFromRequest,
  verifyAccessToken,
  isJwtExpired,
  isJwtInvalid,
  type AccessPayload
} from '@/src/libs/jwt'

export type AuthenticatedUser = {
  id: string
  username: string
  email: string
  tokenVersion: number
  createdAt: Date
  updatedAt: Date
}

// RouteContext standar App Router (ctx selalu ada; params opsional)
export type RouteContext = {
  params?: Record<string, string | string[]>
}

// Context tambahan auth yang akan digabung ke ctx Next
export type AuthContext = {
  user: AuthenticatedUser
  payload: AccessPayload
}

export type AuthenticatedHandler = (
  request: NextRequest,
  context: AuthContext & RouteContext
) => Promise<NextResponse> | NextResponse

function tokenErrorResponse(error: unknown) {
  if (isJwtExpired(error)) {
    return NextResponse.json({ message: 'Access token has expired', code: 'TOKEN_EXPIRED' }, { status: 401 })
  }
  if (isJwtInvalid(error)) {
    return NextResponse.json({ message: 'Invalid access token', code: 'TOKEN_INVALID' }, { status: 401 })
  }
  return NextResponse.json({ message: 'Authentication failed', code: 'AUTH_FAILED' }, { status: 401 })
}

// ---- withAuth: ctx BUKAN opsional ----
export function withAuth(handler: AuthenticatedHandler) {
  return async function (request: NextRequest, ctx: RouteContext) {
    try {
      const token = extractTokenFromRequest(request)
      if (!token) {
        return NextResponse.json({ message: 'Access token required', code: 'TOKEN_MISSING' }, { status: 401 })
      }

      let payload: AccessPayload
      try {
        payload = verifyAccessToken(token)
      } catch (e) {
        return tokenErrorResponse(e)
      }

      const user = await prisma.user.findUnique({ where: { id: payload.userId } })
      if (!user) {
        return NextResponse.json({ message: 'User not found', code: 'USER_NOT_FOUND' }, { status: 404 })
      }

      const authCtx: AuthContext & RouteContext = { ...ctx, user: user as AuthenticatedUser, payload }
      return handler(request, authCtx)
    } catch (error) {
      console.error('Authentication middleware error:', error)
      return NextResponse.json({ message: 'Internal server error', code: 'INTERNAL_ERROR' }, { status: 500 })
    }
  }
}

export function withAuthParams<T extends Record<string, any> = Record<string, string>>(
  handler: (request: NextRequest, context: AuthContext & RouteContext & { params: T }) => Promise<NextResponse> | NextResponse
) {
  return withAuth((req, ctx) => {
    const typedCtx = { ...ctx, params: (ctx.params ?? {}) as T }
    return handler(req, typedCtx)
  })
}

export function withOptionalAuth<
  Ctx extends RouteContext = RouteContext
>(
  handler: (request: NextRequest, context: Ctx | (AuthContext & Ctx)) => Promise<NextResponse> | NextResponse
) {
  return async function (request: NextRequest, ctx: Ctx) {
    try {
      const token = extractTokenFromRequest(request)
      if (!token) {
        return handler(request, ctx)
      }

      try {
        const payload = verifyAccessToken(token)
        const user = await prisma.user.findUnique({ where: { id: payload.userId } })
        if (!user) return handler(request, ctx)

        const authCtx = { ...ctx, user: user as AuthenticatedUser, payload } as AuthContext & Ctx
        return handler(request, authCtx)
      } catch {
        // token error → tetap lanjut tanpa auth
        return handler(request, ctx)
      }
    } catch (error) {
      console.error('Optional auth middleware error:', error)
      return NextResponse.json({ message: 'Internal server error', code: 'INTERNAL_ERROR' }, { status: 500 })
    }
  }
}

export function withTokenVerification() {
  return async function (request: NextRequest) {
    const token = extractTokenFromRequest(request)
    if (!token) {
      return {
        success: false,
        response: NextResponse.json({ message: 'Access token required', code: 'TOKEN_MISSING' }, { status: 401 })
      }
    }
    try {
      const payload = verifyAccessToken(token)
      return { success: true, payload }
    } catch (e) {
      return {
        success: false,
        response: tokenErrorResponse(e)
      }
    }
  }
}
