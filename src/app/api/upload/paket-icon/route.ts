import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { withAuth, type AuthContext } from '@/src/libs/auth-middleware'
import { uploadToS3, deleteFromS3, getS3KeyFromUrl } from '@/src/libs/s3'

async function handlePost(request: NextRequest, { }: AuthContext) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const oldFilePath = formData.get('oldFilePath') as string

    if (!file) {
      return NextResponse.json({ message: 'No file uploaded' }, { status: 400 })
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'image/svg+xml']

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { message: 'Tipe file tidak valid. Hanya JPG, PNG, WebP, dan SVG yang diizinkan' },
        { status: 400 }
      )
    }

    const maxSize = 3 * 1024 * 1024 // 3MB

    if (file.size > maxSize) {
      return NextResponse.json({ message: 'Ukuran file melebihi batas 3MB' }, { status: 400 })
    }

    const extension = file.name.split('.').pop() || 'png'
    const timestamp = Date.now()
    const filename = `paket-icon-${timestamp}.${extension}`
    
    // Delete old file if exists
    if (oldFilePath) {
      try {
        const oldS3Key = getS3KeyFromUrl(oldFilePath)

        if (oldS3Key) {
          await deleteFromS3(oldS3Key)
        } else {
          // Fallback to local filesystem for old files
          const { unlink } = await import('fs/promises')
          const { join } = await import('path')
          const oldFullPath = join(process.cwd(), 'public', oldFilePath)

          await unlink(oldFullPath)
        }
      } catch (err) {
        console.error('Failed to delete old icon:', err)
      }
    }

    // Convert file to buffer and upload to S3
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const s3Key = `paket-icons/${filename}`
    const publicUrl = await uploadToS3(buffer, s3Key, file.type)

    return NextResponse.json({
      message: 'Icon berhasil diupload',
      url: publicUrl,
      filename
    })
  } catch (error) {
    console.error('Upload error:', error)

    return NextResponse.json({ message: 'Gagal mengupload icon' }, { status: 500 })
  }
}

export const POST = withAuth(handlePost)
