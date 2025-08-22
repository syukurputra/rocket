import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/src/libs/prisma'
import { clearSessionCookies, getRefreshTokenFromCookies } from '@/src/libs/session'
import { verifyRefreshToken } from '@/src/libs/jwt'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    // Coba revoke refresh token dg naikkan tokenVersion
    const rt = getRefreshTokenFromCookies(req)
    if (rt) {
      try {
        const payload = verifyRefreshToken(rt) // { userId, tokenVersion, ... }
        await prisma.user.update({
          where: { id: payload.userId },
          data: { tokenVersion: { increment: 1 } } // invalidate semua refresh token lama
        })
      } catch {
        // token invalid/expired → abaikan; tetap bersihkan cookies
      }
    }

    const res = NextResponse.json(
      { message: 'Logout successful' },
      { headers: { 'Cache-Control': 'no-store' } }
    )
    clearSessionCookies(res) // hapus access_token & refresh_token (httpOnly)

    return res
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
