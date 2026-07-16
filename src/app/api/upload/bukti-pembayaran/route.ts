import { NextRequest, NextResponse } from 'next/server'
import { join } from 'path'

import { withAuth, type AuthContext } from '@/src/libs/auth-middleware'
import { uploadToS3, deleteFromS3, getS3KeyFromUrl } from '@/src/libs/s3'

export const runtime = 'nodejs'

// Hapus file lama: dari S3 jika URL S3, atau dari penyimpanan lokal legacy
async function deleteOldFile(oldFilePath: string) {
  if (!oldFilePath) return

  const oldKey = getS3KeyFromUrl(oldFilePath)

  if (oldKey) {
    await deleteFromS3(oldKey).catch(() => {})
  } else if (oldFilePath.startsWith('/uploads/')) {
    try {
      const { unlink } = await import('fs/promises')

      await unlink(join(process.cwd(), 'public', oldFilePath))
    } catch {
      // abaikan jika file lama tidak ada
    }
  }
}

async function handlePost(request: NextRequest, _ctx: AuthContext) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const tagihanId = formData.get('tagihanId') as string
    const oldFilePath = formData.get('oldFilePath') as string

    if (!file) {
      return NextResponse.json({ message: 'Tidak ada file yang diupload' }, { status: 400 })
    }

    if (!tagihanId) {
      return NextResponse.json({ message: 'ID Tagihan wajib diisi' }, { status: 400 })
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { message: 'Tipe file tidak valid. Hanya JPG, PNG, dan PDF yang diizinkan' },
        { status: 400 }
      )
    }

    const maxSize = 5 * 1024 * 1024 // 5MB

    if (file.size > maxSize) {
      return NextResponse.json({ message: 'Ukuran file melebihi batas 5MB' }, { status: 400 })
    }

    // Hapus file lama (mekanisme update)
    if (oldFilePath) await deleteOldFile(oldFilePath)

    const extension = (file.name.split('.').pop() || 'jpg').toLowerCase()
    const key = `bukti-pembayaran/${tagihanId}-${Date.now()}.${extension}`
    const buffer = Buffer.from(await file.arrayBuffer())

    const url = await uploadToS3(buffer, key, file.type)

    return NextResponse.json({
      message: 'File berhasil diupload',
      url,
      filename: key.split('/').pop()
    })
  } catch (error) {
    console.error('Upload error:', error)

    return NextResponse.json({ message: 'Gagal mengupload file' }, { status: 500 })
  }
}

// DELETE /api/upload/bukti-pembayaran?url=<fileUrl> — hapus file dari storage
async function handleDelete(request: NextRequest, _ctx: AuthContext) {
  try {
    const { searchParams } = new URL(request.url)
    const url = searchParams.get('url')

    if (!url) {
      return NextResponse.json({ message: 'URL file wajib diisi' }, { status: 400 })
    }

    await deleteOldFile(url)

    return NextResponse.json({ message: 'File berhasil dihapus' })
  } catch (error) {
    console.error('Delete error:', error)

    return NextResponse.json({ message: 'Gagal menghapus file' }, { status: 500 })
  }
}

export const POST = withAuth(handlePost)
export const DELETE = withAuth(handleDelete)
