import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/src/libs/prisma'
import { verifyAccessToken } from '@/src/libs/jwt'
import {
  extractTokenFromRequest,
  getAccessTokenFromCookies,
  clearSessionCookies
} from '@/src/libs/session'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const token = extractTokenFromRequest(req) || getAccessTokenFromCookies(req)
    if (!token) {
      return NextResponse.json({ message: 'Token akses diperlukan' }, { status: 401 })
    }

    let payload: { userId: string }
    try {
      payload = verifyAccessToken(token) as { userId: string }
    } catch {
      return NextResponse.json({ message: 'Token tidak valid atau sudah kadaluarsa' }, { status: 401 })
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { id: payload.userId },
        data: { tokenVersion: { increment: 1 } }
      }),
    ])

    const res = NextResponse.json({ message: 'Semua token berhasil dicabut' }, { headers: { 'Cache-Control': 'no-store' } })
    clearSessionCookies(res)
    return res
  } catch (error) {
    console.error('Revoke tokens error:', error)
    return NextResponse.json({ message: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
