import { NextRequest } from 'next/server'
import { verifyAccessToken } from '@/lib/jwt'

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    userId: string
    username: string
    email: string
  }
}

// Higher-order function to protect API routes
export function withAuth(handler: (req: AuthenticatedRequest) => Promise<Response>) {
  return async (request: NextRequest) => {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')

    if (!token) {
      return Response.json(
        { message: 'Access token required' },
        { status: 401 }
      )
    }

    const payload = verifyAccessToken(token)

    if (!payload) {
      return Response.json(
        { message: 'Invalid or expired token' },
        { status: 401 }
      )
    }

    // Add user info to request
    const authenticatedRequest = request as AuthenticatedRequest
    authenticatedRequest.user = {
      userId: payload.userId,
      username: payload.username,
      email: payload.email
    }

    return handler(authenticatedRequest)
  }
}

// Example usage of withAuth in an API route:
// export const GET = withAuth(async (request: AuthenticatedRequest) => {
//   const { userId } = request.user!
//   // Your protected API logic here
//   return Response.json({ message: 'Protected data', userId })
// })
