import { writeFile, mkdir, unlink } from 'fs/promises'
import { join } from 'path'

import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { withAuth, type AuthContext } from '@/src/libs/auth-middleware'

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
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const uploadDir = join(process.cwd(), 'public', 'uploads', 'paket-icons')

    await mkdir(uploadDir, { recursive: true })

    // Delete old file if exists
    if (oldFilePath) {
      try {
        const oldFullPath = join(process.cwd(), 'public', oldFilePath)

        await unlink(oldFullPath)
      } catch {
        // ignore if old file doesn't exist
      }
    }

    const filepath = join(uploadDir, filename)

    await writeFile(filepath, buffer)

    const publicUrl = `/uploads/paket-icons/${filename}`

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
