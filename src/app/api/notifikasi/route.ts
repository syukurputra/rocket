import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import prisma from '@/src/libs/prisma'
import { withAuth, type AuthContext } from '@/src/libs/auth-middleware'

// GET /api/notifikasi - List notifikasi milik user yang sedang login
async function handleGet(_request: NextRequest, { user }: AuthContext) {
  try {
    const notifikasi = await prisma.notifikasi.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 20
    })

    return NextResponse.json({ data: notifikasi })
  } catch (error) {
    console.error('Get notifikasi error:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/notifikasi - Buat notifikasi baru
async function handlePost(request: NextRequest, { user }: AuthContext) {
  try {
    const body = await request.json()
    const { title, subtitle, avatarIcon, avatarColor, type, url, refId, userId } = body

    if (!title || !type) {
      return NextResponse.json({ message: 'title dan type harus diisi' }, { status: 400 })
    }

    // userId dari body jika ingin kirim ke user lain, default ke user yang request
    const targetUserId = userId || user.id

    const notif = await prisma.notifikasi.create({
      data: {
        title,
        subtitle: subtitle || '',
        avatarIcon: avatarIcon || null,
        avatarColor: avatarColor || null,
        type,
        url: url || null,
        refId: refId || null,
        userId: targetUserId
      }
    })

    return NextResponse.json({ data: notif, message: 'Notifikasi berhasil dibuat' }, { status: 201 })
  } catch (error) {
    console.error('Create notifikasi error:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

export const GET = withAuth(handleGet)
export const POST = withAuth(handlePost)
