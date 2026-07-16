import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import prisma from '@/src/libs/prisma'
import { withAuth, type AuthContext } from '@/src/libs/auth-middleware'
import { uploadToS3 } from '@/src/libs/s3'

export const runtime = 'nodejs'

const ALLOWED_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
  'application/msword', // .doc
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document' // .docx
]

const MAX_SIZE = 5 * 1024 * 1024 // 5MB

async function handlePost(request: NextRequest, { user }: AuthContext) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const conversationId = formData.get('conversationId') as string | null

    if (!file) {
      return NextResponse.json({ message: 'Tidak ada file yang diupload' }, { status: 400 })
    }

    if (!conversationId) {
      return NextResponse.json({ message: 'conversationId wajib diisi' }, { status: 400 })
    }

    // Pastikan user adalah peserta percakapan
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      select: { id: true, userId: true, companyId: true }
    })

    if (!conversation) {
      return NextResponse.json({ message: 'Percakapan tidak ditemukan' }, { status: 404 })
    }

    const isParticipant =
      conversation.userId === user.id || (user.companyId && conversation.companyId === user.companyId)

    if (!isParticipant) {
      return NextResponse.json({ message: 'Tidak diizinkan' }, { status: 403 })
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { message: 'Tipe file tidak valid. Hanya gambar, PDF, dan Word yang diizinkan' },
        { status: 400 }
      )
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ message: 'Ukuran file melebihi batas 5MB' }, { status: 400 })
    }

    const extension = (file.name.split('.').pop() || 'bin').toLowerCase()
    const key = `chat/${conversationId}-${Date.now()}.${extension}`
    const buffer = Buffer.from(await file.arrayBuffer())

    const url = await uploadToS3(buffer, key, file.type)

    return NextResponse.json({
      message: 'File berhasil diupload',
      url,
      name: file.name,
      type: file.type
    })
  } catch (error) {
    console.error('Chat upload error:', error)

    return NextResponse.json({ message: 'Gagal mengupload file' }, { status: 500 })
  }
}

export const POST = withAuth(handlePost)
