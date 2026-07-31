import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import prisma from '@/src/libs/prisma'
import { withAuth, type AuthContext } from '@/src/libs/auth-middleware'

/**
 * POST /api/chat/conversations/usaha  { userId, asetId? }
 *
 * Kebalikan dari POST /api/chat/conversations: percakapan dimulai dari sisi
 * usaha ke pelanggan, dipakai tombol chat pada daftar Booking Aset.
 */
async function handlePost(request: NextRequest, { user }: AuthContext) {
  try {
    if (!user.companyId) {
      return NextResponse.json({ message: 'User tidak terkait dengan perusahaan' }, { status: 400 })
    }

    const { userId, asetId } = await request.json()

    if (!userId) {
      return NextResponse.json({ message: 'userId wajib diisi' }, { status: 400 })
    }

    // Penyewa tanpa akun (booking tanpa login) tidak bisa dihubungi lewat chat
    const pelanggan = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } })

    if (!pelanggan) {
      return NextResponse.json({ message: 'Penyewa ini tidak punya akun sehingga belum bisa dihubungi lewat chat' }, { status: 404 })
    }

    let conversation = await prisma.conversation.findUnique({
      where: { userId_companyId: { userId, companyId: user.companyId } }
    })

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: { userId, companyId: user.companyId, asetId: asetId || null }
      })
    } else if (asetId && conversation.asetId !== asetId) {
      conversation = await prisma.conversation.update({
        where: { id: conversation.id },
        data: { asetId }
      })
    }

    return NextResponse.json({ data: { id: conversation.id }, message: 'Percakapan siap' }, { status: 201 })
  } catch (error) {
    console.error('Create conversation usaha error:', error)

    return NextResponse.json({ message: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

export const POST = withAuth(handlePost)
