import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/src/libs/prisma'
import { verifyAccessToken } from '@/src/libs/jwt'
import { extractTokenFromRequest, getAccessTokenFromCookies } from '@/src/libs/session'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  try {
    const token =
      extractTokenFromRequest(req) || // Authorization: Bearer <token>
      getAccessTokenFromCookies(req)   // httpOnly cookie

    if (!token) {
      return NextResponse.json({ message: 'Access token required' }, { status: 401 })
    }

    let payload: { userId: string }
    try {
      payload = verifyAccessToken(token) as { userId: string }
    } catch {
      return NextResponse.json({ message: 'Invalid or expired token' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, username: true, email: true, createdAt: true, updatedAt: true }
    })

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({ user }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (err) {
    console.error('Get user error:', err)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
