import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import prisma from '@/src/libs/prisma'
import { withAuth, type AuthContext } from '@/src/libs/auth-middleware'

// GET /api/chat/conversations?scope=saya|usaha
// - scope=saya  : percakapan di mana user ini sebagai pelanggan (userId = user.id)
// - scope=usaha : percakapan yang masuk ke perusahaan user ini (companyId = user.companyId)
async function handleGet(request: NextRequest, { user }: AuthContext) {
  try {
    const { searchParams } = new URL(request.url)
    const scope = searchParams.get('scope') === 'usaha' ? 'usaha' : 'saya'

    if (scope === 'usaha' && !user.companyId) {
      return NextResponse.json({ data: [], message: 'User tidak terkait dengan perusahaan' })
    }

    const whereClause = scope === 'usaha' ? { companyId: user.companyId as string } : { userId: user.id }

    const conversations = await prisma.conversation.findMany({
      where: whereClause,
      include: {
        company: { select: { id: true, nama: true } },
        user: { select: { id: true, name: true, username: true, photoUrl: true } },
        aset: { select: { id: true, nama: true } }
      },
      orderBy: { lastMessageAt: 'desc' }
    })

    const data = conversations.map(c => {
      // Kontak = pihak lawan bicara
      const isUsaha = scope === 'usaha'

      return {
        id: c.id,
        companyId: c.companyId,
        userId: c.userId,
        asetId: c.asetId,
        asetNama: c.aset?.nama || null,
        // Nama & foto lawan bicara
        contactName: isUsaha ? c.user?.name || c.user?.username || 'Pelanggan' : c.company?.nama || 'Usaha',
        contactPhoto: isUsaha ? c.user?.photoUrl || null : null,
        contactSubtitle: isUsaha ? c.aset?.nama || 'Pelanggan' : c.aset?.nama || 'Usaha',
        lastMessage: c.lastMessage,
        lastMessageAt: c.lastMessageAt,
        unread: isUsaha ? c.unreadCompany : c.unreadUser
      }
    })

    return NextResponse.json({ data, message: 'Data berhasil diambil' })
  } catch (error) {
    console.error('Get conversations error:', error)

    return NextResponse.json({ message: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

// POST /api/chat/conversations  { companyId, asetId? }
// Mulai / ambil percakapan antara user (pelanggan) dengan sebuah perusahaan.
async function handlePost(request: NextRequest, { user }: AuthContext) {
  try {
    const body = await request.json()
    const { companyId, asetId } = body

    if (!companyId) {
      return NextResponse.json({ message: 'companyId wajib diisi' }, { status: 400 })
    }

    // Tidak boleh chat dengan perusahaan sendiri
    if (user.companyId && user.companyId === companyId) {
      return NextResponse.json({ message: 'Tidak dapat memulai chat dengan usaha sendiri' }, { status: 400 })
    }

    const company = await prisma.company.findUnique({ where: { id: companyId }, select: { id: true } })

    if (!company) {
      return NextResponse.json({ message: 'Usaha tidak ditemukan' }, { status: 404 })
    }

    // Cari percakapan yang sudah ada (unique userId + companyId)
    let conversation = await prisma.conversation.findUnique({
      where: { userId_companyId: { userId: user.id, companyId } }
    })

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          userId: user.id,
          companyId,
          asetId: asetId || null
        }
      })
    } else if (asetId && conversation.asetId !== asetId) {
      // Perbarui konteks aset ke aset terakhir yang dibuka
      conversation = await prisma.conversation.update({
        where: { id: conversation.id },
        data: { asetId }
      })
    }

    return NextResponse.json({ data: { id: conversation.id }, message: 'Percakapan siap' }, { status: 201 })
  } catch (error) {
    console.error('Create conversation error:', error)

    return NextResponse.json({ message: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

export const GET = withAuth(handleGet)
export const POST = withAuth(handlePost)
