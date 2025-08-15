import { NextRequest, NextResponse } from 'next/server'
import { extractTokenFromRequest, verifyAccessToken } from '../../../../../lib/jwt'
import prisma from '../../../../../lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const token = extractTokenFromRequest(request)

    if (!token) {
      return NextResponse.json(
        { message: 'Access token required' },
        { status: 401 }
      )
    }

    const payload = verifyAccessToken(token)

    if (!payload) {
      return NextResponse.json(
        { message: 'Invalid or expired token' },
        { status: 401 }
      )
    }

    // Increment token version to invalidate all existing refresh tokens
    await prisma.user.update({
      where: { id: payload.userId },
      data: { tokenVersion: { increment: 1 } }
    })

    // Delete all sessions for this user
    await prisma.session.deleteMany({
      where: { userId: payload.userId }
    })

    return NextResponse.json({
      message: 'All tokens revoked successfully'
    })

  } catch (error) {
    console.error('Revoke tokens error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
