import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import prisma from '@/src/libs/prisma'
import { withAuth, type AuthContext } from '@/src/libs/auth-middleware'
import { uploadToS3, deleteFromS3, getS3KeyFromUrl } from '@/src/libs/s3'

type ParamCtx = AuthContext & { params: { id: string } }

async function handlePost(request: NextRequest, { params }: ParamCtx) {
  try {
    const { id } = params

    const existing = await prisma.$queryRaw<{ id: string; imageUrl: string | null }[]>`
      SELECT id, "imageUrl" FROM banner_promo WHERE id = ${id}
    `

    if (existing.length === 0) {
      return NextResponse.json({ message: 'Banner promo tidak ditemukan' }, { status: 404 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ message: 'File gambar harus diupload' }, { status: 400 })
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ message: 'Hanya file gambar yang diizinkan' }, { status: 400 })
    }

    const maxSize = 5 * 1024 * 1024

    if (file.size > maxSize) {
      return NextResponse.json({ message: `File terlalu besar. Maksimal 5MB.` }, { status: 400 })
    }

    // Hapus gambar lama jika ada
    if (existing[0].imageUrl) {
      try {
        const oldKey = getS3KeyFromUrl(existing[0].imageUrl)

        if (oldKey) await deleteFromS3(oldKey)
      } catch (e) {
        console.error('Failed to delete old S3 image:', e)
      }
    }

    const ext = file.name.split('.').pop() || 'jpg'
    const key = `banner-promo/${id}/image-${Date.now()}.${ext}`
    const buffer = Buffer.from(await file.arrayBuffer())
    const imageUrl = await uploadToS3(buffer, key, file.type)

    const now = new Date()

    await prisma.$executeRaw`
      UPDATE banner_promo SET "imageUrl" = ${imageUrl}, "updatedAt" = ${now} WHERE id = ${id}
    `

    return NextResponse.json({ data: { imageUrl }, message: 'Gambar berhasil diupload' })
  } catch (error) {
    console.error('Upload banner promo image error:', error)

    return NextResponse.json({ message: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

async function handleDelete(request: NextRequest, { params }: ParamCtx) {
  try {
    const { id } = params

    const existing = await prisma.$queryRaw<{ imageUrl: string | null }[]>`
      SELECT "imageUrl" FROM banner_promo WHERE id = ${id}
    `

    if (existing.length === 0) {
      return NextResponse.json({ message: 'Banner promo tidak ditemukan' }, { status: 404 })
    }

    if (!existing[0].imageUrl) {
      return NextResponse.json({ message: 'Tidak ada gambar untuk dihapus' }, { status: 400 })
    }

    const key = getS3KeyFromUrl(existing[0].imageUrl)

    if (key) await deleteFromS3(key)

    const now = new Date()

    await prisma.$executeRaw`
      UPDATE banner_promo SET "imageUrl" = NULL, "updatedAt" = ${now} WHERE id = ${id}
    `

    return NextResponse.json({ message: 'Gambar berhasil dihapus' })
  } catch (error) {
    console.error('Delete banner promo image error:', error)

    return NextResponse.json({ message: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

export const POST = withAuth<{ id: string }>(handlePost)
export const DELETE = withAuth<{ id: string }>(handleDelete)
