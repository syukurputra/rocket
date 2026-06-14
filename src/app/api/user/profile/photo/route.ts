import { NextRequest, NextResponse } from 'next/server'

import prisma from '@/src/libs/prisma'
import { verifyAccessToken } from '@/src/libs/jwt'
import { extractTokenFromRequest, getAccessTokenFromCookies } from '@/src/libs/session'
import { uploadToS3, deleteFromS3, getS3KeyFromUrl } from '@/src/libs/s3'

export const runtime = 'nodejs'

function getAuth(req: NextRequest): string | null {
  return extractTokenFromRequest(req) || getAccessTokenFromCookies(req) || null
}

// POST /api/user/profile/photo — upload foto profil ke S3
export async function POST(req: NextRequest) {
  try {
    const token = getAuth(req)
    if (!token) return NextResponse.json({ message: 'Token akses diperlukan' }, { status: 401 })

    let payload: { userId: string }
    try {
      payload = verifyAccessToken(token) as { userId: string }
    } catch {
      return NextResponse.json({ message: 'Token tidak valid atau sudah kadaluarsa' }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) return NextResponse.json({ message: 'Tidak ada file yang diupload' }, { status: 400 })

    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ message: 'Tipe file tidak valid. Hanya JPG, PNG, dan WebP yang diizinkan' }, { status: 400 })
    }

    const maxSize = 2 * 1024 * 1024 // 2MB
    if (file.size > maxSize) {
      return NextResponse.json({ message: 'Ukuran file melebihi batas 2MB' }, { status: 400 })
    }

    // Hapus foto lama dari S3 jika ada
    const existing = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { photoUrl: true }
    })

    if (existing?.photoUrl) {
      const oldKey = getS3KeyFromUrl(existing.photoUrl)
      if (oldKey) await deleteFromS3(oldKey).catch(() => {})
    }

    const ext = file.name.split('.').pop() || 'jpg'
    const key = `profile-photos/${payload.userId}-${Date.now()}.${ext}`
    const buffer = Buffer.from(await file.arrayBuffer())
    const url = await uploadToS3(buffer, key, file.type)

    const user = await prisma.user.update({
      where: { id: payload.userId },
      data: { photoUrl: url },
      select: { id: true, photoUrl: true }
    })

    return NextResponse.json({ message: 'Foto profil berhasil diupload', photoUrl: user.photoUrl })
  } catch (err) {
    console.error('Upload profile photo error:', err)
    return NextResponse.json({ message: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

// DELETE /api/user/profile/photo — hapus foto profil dari S3
export async function DELETE(req: NextRequest) {
  try {
    const token = getAuth(req)
    if (!token) return NextResponse.json({ message: 'Token akses diperlukan' }, { status: 401 })

    let payload: { userId: string }
    try {
      payload = verifyAccessToken(token) as { userId: string }
    } catch {
      return NextResponse.json({ message: 'Token tidak valid atau sudah kadaluarsa' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { photoUrl: true }
    })

    if (!user?.photoUrl) {
      return NextResponse.json({ message: 'Tidak ada foto profil untuk dihapus' }, { status: 400 })
    }

    const key = getS3KeyFromUrl(user.photoUrl)
    if (key) await deleteFromS3(key).catch(() => {})

    await prisma.user.update({
      where: { id: payload.userId },
      data: { photoUrl: null }
    })

    return NextResponse.json({ message: 'Foto profil berhasil dihapus' })
  } catch (err) {
    console.error('Delete profile photo error:', err)
    return NextResponse.json({ message: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
