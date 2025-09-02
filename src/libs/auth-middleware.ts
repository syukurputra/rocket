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

export type AuthContext = {
  user: AuthenticatedUser
  payload: AccessPayload
}

export type AuthenticatedHandler = (
  request: NextRequest,
  context: AuthContext,
  params?: any
) => Promise<NextResponse>

/**
 * Global authentication middleware untuk Next.js API routes
 * @param handler - Handler function yang akan dijalankan setelah authentication berhasil
 * @returns NextResponse
 */
export function withAuth(handler: AuthenticatedHandler) {
  return async function(request: NextRequest, { params }: { params?: any } = {}) {
    try {
      const token = extractTokenFromRequest(request)
      if (!token) {
        return NextResponse.json(
          {
            message: 'Access token required',
            code: 'TOKEN_MISSING'
          },
          { status: 401 }
        )
      }

      let payload: AccessPayload
      try {
        payload = verifyAccessToken(token)
      } catch (error) {
        if (isJwtExpired(error)) {
          return NextResponse.json(
            {
              message: 'Access token has expired',
              code: 'TOKEN_EXPIRED'
            },
            { status: 401 }
          )
        }

        if (isJwtInvalid(error)) {
          return NextResponse.json(
            {
              message: 'Invalid access token',
              code: 'TOKEN_INVALID'
            },
            { status: 401 }
          )
        }

        return NextResponse.json(
          {
            message: 'Authentication failed',
            code: 'AUTH_FAILED'
          },
          { status: 401 }
        )
      }

      const user = await prisma.user.findUnique({
        where: { id: payload.userId }
      })

      if (!user) {
        return NextResponse.json(
          {
            message: 'User not found',
            code: 'USER_NOT_FOUND'
          },
          { status: 404 }
        )
      }

      const authContext: AuthContext = {
        user: user as AuthenticatedUser,
        payload
      }

      return await handler(request, authContext, params)

    } catch (error) {
      return NextResponse.json(
        {
          message: 'Internal server error',
          code: 'INTERNAL_ERROR'
        },
        { status: 500 }
      )
    }
  }
}

export function withTokenVerification() {
  return async function(request: NextRequest) {
    const token = extractTokenFromRequest(request)

    if (!token) {
      return {
        success: false,
        response: NextResponse.json(
          {
            message: 'Access token required',
            code: 'TOKEN_MISSING'
          },
          { status: 401 }
        )
      }
    }

    try {
      const payload = verifyAccessToken(token)
      return {
        success: true,
        payload
      }
    } catch (error) {
      if (isJwtExpired(error)) {
        return {
          success: false,
          response: NextResponse.json(
            {
              message: 'Access token has expired',
              code: 'TOKEN_EXPIRED'
            },
            { status: 401 }
          )
        }
      }

      if (isJwtInvalid(error)) {
        return {
          success: false,
          response: NextResponse.json(
            {
              message: 'Invalid access token',
              code: 'TOKEN_INVALID'
            },
            { status: 401 }
          )
        }
      }

      return {
        success: false,
        response: NextResponse.json(
          {
            message: 'Authentication failed',
            code: 'AUTH_FAILED'
          },
          { status: 401 }
        )
      }
    }
  }
}

export function withOptionalAuth(handler: (request: NextRequest, context?: AuthContext, params?: any) => Promise<NextResponse>) {
  return async function(request: NextRequest, { params }: { params?: any } = {}) {
    try {
      const token = extractTokenFromRequest(request)

      if (!token) {
        // Tidak ada token, jalankan handler tanpa context
        return await handler(request, undefined, params)
      }

      try {
        const payload = verifyAccessToken(token)
        const user = await prisma.user.findUnique({
          where: { id: payload.userId }
        })

        if (!user) {
          return await handler(request, undefined, params)
        }

        const authContext: AuthContext = {
          user: user as AuthenticatedUser,
          payload
        }

        return await handler(request, authContext, params)
      } catch (error) {
        // Token error, jalankan handler tanpa context
        return await handler(request, undefined, params)
      }

    } catch (error) {
      console.error('Optional auth middleware error:', error)
      return NextResponse.json(
        {
          message: 'Internal server error',
          code: 'INTERNAL_ERROR'
        },
        { status: 500 }
      )
    }
  }
}
