import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyAccessToken } from '@/lib/jwt'
import {
  extractTokenFromRequest,
  getAccessTokenFromCookies,
  clearSessionCookies
} from '@/lib/session'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const token = extractTokenFromRequest(req) || getAccessTokenFromCookies(req)
    if (!token) {
      return NextResponse.json({ message: 'Access token required' }, { status: 401 })
    }

    let payload: { userId: string }
    try {
      payload = verifyAccessToken(token) as { userId: string }
    } catch {
      return NextResponse.json({ message: 'Invalid or expired token' }, { status: 401 })
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { id: payload.userId },
        data: { tokenVersion: { increment: 1 } } // revoke semua refresh token
      }),
      prisma.session.deleteMany({ where: { userId: payload.userId } }) // jika pakai tabel sessions
    ])

    const res = NextResponse.json({ message: 'All tokens revoked successfully' }, { headers: { 'Cache-Control': 'no-store' } })
    clearSessionCookies(res) // hapus access_token & refresh_token (httpOnly)
    return res
  } catch (error) {
    console.error('Revoke tokens error:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
