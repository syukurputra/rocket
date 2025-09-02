import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/src/libs/prisma'
import {
  extractTokenFromRequest,
  verifyAccessToken,
  isJwtExpired,
  isJwtInvalid,
  type AccessPayload
} from '@/src/libs/jwt'

// Type untuk authenticated user
export type AuthenticatedUser = {
  id: string
  username: string
  email: string
  tokenVersion: number
  createdAt: Date
  updatedAt: Date
}

// Type untuk context yang diteruskan ke handler
export type AuthContext = {
  user: AuthenticatedUser
  payload: AccessPayload
}

// Type untuk Next.js route context
type RouteContext = {
  params?: Promise<any> | any
}

// Type untuk authenticated handler function - simplified
type AuthenticatedHandler = (
  request: NextRequest,
  context: AuthContext
) => Promise<NextResponse>

/**
 * Global authentication middleware untuk Next.js API routes
 * @param handler - Handler function yang akan dijalankan setelah authentication berhasil
 * @returns NextResponse handler function
 */
export function withAuth(handler: AuthenticatedHandler) {
  return async function(request: NextRequest, context?: RouteContext) {
    try {
      // Extract token dari request
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

      // Verify token
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

      // Get user dari database
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

      // Buat auth context
      const authContext: AuthContext = {
        user: user as AuthenticatedUser,
        payload
      }

      // Jalankan handler dengan context
      return await handler(request, authContext)

    } catch (error) {
      console.error('Authentication middleware error:', error)
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

/**
 * For dynamic routes that need params
 */
export function withAuthParams<T = any>(
  handler: (request: NextRequest, context: AuthContext, params: T) => Promise<NextResponse>
) {
  return async function(request: NextRequest, routeContext: { params: Promise<T> | T }) {
    try {
      // Extract token dari request
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

      // Verify token
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

      // Get user dari database
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

      // Buat auth context
      const authContext: AuthContext = {
        user: user as AuthenticatedUser,
        payload
      }

      // Resolve params if it's a Promise
      let resolvedParams = routeContext.params
      if (resolvedParams && typeof resolvedParams.then === 'function') {
        resolvedParams = await resolvedParams
      }

      // Jalankan handler dengan context
      return await handler(request, authContext, resolvedParams)

    } catch (error) {
      console.error('Authentication middleware error:', error)
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

/**
 * Lightweight auth verification tanpa database lookup
 * Hanya verify token dan return payload
 */
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

/**
 * Optional auth - tidak throw error jika tidak ada token
 * Berguna untuk endpoint yang bisa diakses dengan atau tanpa auth
 */
export function withOptionalAuth(
  handler: (request: NextRequest, context?: AuthContext) => Promise<NextResponse>
) {
  return async function(request: NextRequest, context?: RouteContext) {
    try {
      const token = extractTokenFromRequest(request)

      if (!token) {
        // Tidak ada token, jalankan handler tanpa context
        return await handler(request, undefined)
      }

      try {
        const payload = verifyAccessToken(token)
        const user = await prisma.user.findUnique({
          where: { id: payload.userId }
        })

        if (!user) {
          // User tidak ditemukan, jalankan handler tanpa context
          return await handler(request, undefined)
        }

        const authContext: AuthContext = {
          user: user as AuthenticatedUser,
          payload
        }

        return await handler(request, authContext)
      } catch (error) {
        // Token error, jalankan handler tanpa context
        return await handler(request, undefined)
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
