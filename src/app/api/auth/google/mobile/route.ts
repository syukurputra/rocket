import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import prisma from '@/src/libs/prisma'
import { signAccessToken, signRefreshToken } from '@/src/libs/jwt'
import { setSessionCookies } from '@/src/libs/session'
import {
  ambilMenuUser,
  cariAtauBuatUserGoogle,
  GoogleAuthError,
  verifikasiIdTokenGoogle
} from '@/src/libs/googleAuth'

export const runtime = 'nodejs'

/**
 * POST /api/auth/google/mobile
 *
 * Login Google untuk aplikasi mobile. Berbeda dengan `/api/auth/google` yang
 * memakai redirect browser, endpoint ini menerima ID token yang sudah dipegang
 * SDK Google native lalu menukarnya dengan token sesi aplikasi.
 *
 * Body   : { "idToken": "<ID token dari Google Sign-In>" }
 * Balasan: bentuknya sama dengan /api/auth/login, supaya klien bisa memakai
 *          jalur penyimpanan sesi yang sama.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}) as Record<string, unknown>)
    const idToken = typeof body?.idToken === 'string' ? body.idToken : ''

    if (!idToken) {
      return NextResponse.json({ message: 'idToken wajib dikirim' }, { status: 400 })
    }

    const profil = await verifikasiIdTokenGoogle(idToken)
    const user = await cariAtauBuatUserGoogle(profil)

    if (!user.status) {
      return NextResponse.json({ message: 'Akun ini sedang tidak aktif' }, { status: 403 })
    }

    const accessToken = signAccessToken({
      userId: user.id,
      username: user.username,
      email: user.email
    })

    const refreshToken = signRefreshToken({
      userId: user.id,
      tokenVersion: user.tokenVersion || 0
    })

    const [menus, relasi] = await Promise.all([
      ambilMenuUser(user.id),
      prisma.user.findUnique({
        where: { id: user.id },
        select: {
          role: { select: { id: true, nama: true, deskripsi: true } },
          company: { select: { id: true, nama: true, paketId: true } }
        }
      })
    ])

    const res = NextResponse.json(
      {
        message: 'Login berhasil',
        user: {
          id: user.id,
          username: user.username,
          name: user.name,
          email: user.email,
          nomorTelepon: user.nomorTelepon,
          company: relasi?.company ?? null,
          role: relasi?.role ?? null
        },
        menus,
        accessToken,
        refreshToken,

        // Akun hasil Google belum tentu punya nomor telepon, padahal checkout
        // mewajibkannya. Klien memakai penanda ini untuk meminta pelengkapan.
        needsPhone: !user.nomorTelepon
      },
      { status: 200, headers: { 'Cache-Control': 'no-store' } }
    )

    // Cookie tetap diset supaya endpoint yang membaca sesi lewat cookie
    // ikut berfungsi kalau nanti dipakai dari web.
    setSessionCookies(res, { accessToken, refreshToken })

    return res
  } catch (error) {
    if (error instanceof GoogleAuthError) {
      return NextResponse.json({ message: error.message }, { status: error.status })
    }

    console.error('Google mobile auth error:', error)

    return NextResponse.json({ message: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
