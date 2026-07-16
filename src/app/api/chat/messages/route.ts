import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import prisma from '@/src/libs/prisma'
import { withAuth, type AuthContext } from '@/src/libs/auth-middleware'

type Participant = 'USER' | 'COMPANY'

// Tentukan peran user dalam sebuah percakapan. null jika bukan peserta.
function resolveRole(
  conversation: { userId: string; companyId: string },
  user: { id: string; companyId: string | null }
): Participant | null {
  if (conversation.userId === user.id) return 'USER'
  if (user.companyId && conversation.companyId === user.companyId) return 'COMPANY'

  return null
}

// GET /api/chat/messages?conversationId=...  → daftar pesan + tandai terbaca
async function handleGet(request: NextRequest, { user }: AuthContext) {
  try {
    const { searchParams } = new URL(request.url)
    const conversationId = searchParams.get('conversationId')

    if (!conversationId) {
      return NextResponse.json({ message: 'conversationId wajib diisi' }, { status: 400 })
    }

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        company: { select: { id: true, nama: true } },
        user: { select: { id: true, name: true, username: true, photoUrl: true } },
        aset: { select: { id: true, nama: true } }
      }
    })

    if (!conversation) {
      return NextResponse.json({ message: 'Percakapan tidak ditemukan' }, { status: 404 })
    }

    const role = resolveRole(conversation, user)

    if (!role) {
      return NextResponse.json({ message: 'Tidak diizinkan' }, { status: 403 })
    }

    const messages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' }
    })

    // Ambil kolom attachment via raw SQL (kolom baru, Prisma Client belum di-regenerate)
    const attachRows = await prisma.$queryRaw<
      { id: string; attachmentUrl: string | null; attachmentName: string | null; attachmentType: string | null }[]
    >`SELECT id, "attachmentUrl", "attachmentName", "attachmentType" FROM "message" WHERE "conversationId" = ${conversationId}`
    const attachMap = new Map(attachRows.map(r => [r.id, r]))

    // Tandai pesan dari lawan bicara sebagai terbaca + reset unread
    const incomingType: Participant = role === 'USER' ? 'COMPANY' : 'USER'

    await prisma.message.updateMany({
      where: { conversationId, senderType: incomingType, isRead: false },
      data: { isRead: true }
    })

    await prisma.conversation.update({
      where: { id: conversationId },
      data: role === 'USER' ? { unreadUser: 0 } : { unreadCompany: 0 }
    })

    return NextResponse.json({
      data: {
        role,
        conversation: {
          id: conversation.id,
          companyId: conversation.companyId,
          userId: conversation.userId,
          asetNama: conversation.aset?.nama || null,
          contactName:
            role === 'COMPANY'
              ? conversation.user?.name || conversation.user?.username || 'Pelanggan'
              : conversation.company?.nama || 'Usaha',
          contactPhoto: role === 'COMPANY' ? conversation.user?.photoUrl || null : null
        },
        messages: messages.map(m => {
          const att = attachMap.get(m.id)

          return {
            id: m.id,
            senderType: m.senderType,
            senderId: m.senderId,
            body: m.body,
            attachmentUrl: att?.attachmentUrl || null,
            attachmentName: att?.attachmentName || null,
            attachmentType: att?.attachmentType || null,
            isRead: m.isRead,
            createdAt: m.createdAt,
            isMine: m.senderType === role
          }
        })
      },
      message: 'Data berhasil diambil'
    })
  } catch (error) {
    console.error('Get messages error:', error)

    return NextResponse.json({ message: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

// POST /api/chat/messages  { conversationId, body }
async function handlePost(request: NextRequest, { user }: AuthContext) {
  try {
    const payload = await request.json()
    const { conversationId, body, attachmentUrl, attachmentName, attachmentType } = payload

    const trimmed = body ? String(body).trim() : ''
    const hasAttachment = Boolean(attachmentUrl)

    if (!conversationId || (!trimmed && !hasAttachment)) {
      return NextResponse.json({ message: 'conversationId dan isi pesan/lampiran wajib diisi' }, { status: 400 })
    }

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      select: { id: true, userId: true, companyId: true }
    })

    if (!conversation) {
      return NextResponse.json({ message: 'Percakapan tidak ditemukan' }, { status: 404 })
    }

    const role = resolveRole(conversation, user)

    if (!role) {
      return NextResponse.json({ message: 'Tidak diizinkan' }, { status: 403 })
    }

    const message = await prisma.message.create({
      data: {
        conversationId,
        senderType: role,
        senderId: user.id,
        body: trimmed
      }
    })

    // Simpan kolom attachment via raw SQL (kolom baru, Prisma Client belum di-regenerate)
    if (hasAttachment) {
      await prisma.$executeRaw`
        UPDATE "message"
        SET "attachmentUrl" = ${attachmentUrl},
            "attachmentName" = ${attachmentName || null},
            "attachmentType" = ${attachmentType || null}
        WHERE id = ${message.id}
      `
    }

    // Ringkasan untuk daftar percakapan
    const summary = trimmed || `📎 ${attachmentName || 'Lampiran'}`

    // Update ringkasan percakapan + tambah unread untuk penerima
    await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        lastMessage: summary.slice(0, 200),
        lastMessageAt: new Date(),
        ...(role === 'USER' ? { unreadCompany: { increment: 1 } } : { unreadUser: { increment: 1 } })
      }
    })

    return NextResponse.json(
      {
        data: {
          id: message.id,
          senderType: message.senderType,
          senderId: message.senderId,
          body: message.body,
          attachmentUrl: hasAttachment ? attachmentUrl : null,
          attachmentName: hasAttachment ? attachmentName || null : null,
          attachmentType: hasAttachment ? attachmentType || null : null,
          isRead: message.isRead,
          createdAt: message.createdAt,
          isMine: true
        },
        message: 'Pesan terkirim'
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Send message error:', error)

    return NextResponse.json({ message: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

export const GET = withAuth(handleGet)
export const POST = withAuth(handlePost)
