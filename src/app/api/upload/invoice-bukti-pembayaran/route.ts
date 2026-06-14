import { NextRequest, NextResponse } from 'next/server'
import { writeFile } from 'fs/promises'
import { join } from 'path'
import { withAuth, type AuthContext } from '@/src/libs/auth-middleware'

async function handlePost(request: NextRequest, { user }: AuthContext) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const invoiceId = formData.get('invoiceId') as string
    const oldFilePath = formData.get('oldFilePath') as string

    if (!file) {
      return NextResponse.json({ message: 'Tidak ada file yang diupload' }, { status: 400 })
    }

    if (!invoiceId) {
      return NextResponse.json({ message: 'Invoice ID is required' }, { status: 400 })
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ message: 'Tipe file tidak valid. Hanya JPG, PNG, dan PDF yang diizinkan' }, { status: 400 })
    }

    const maxSize = 5 * 1024 * 1024 // 5MB

    if (file.size > maxSize) {
      return NextResponse.json({ message: 'Ukuran file melebihi batas 5MB' }, { status: 400 })
    }

    const extension = file.name.split('.').pop() || 'jpg'
    const filename = `${invoiceId}.${extension}`
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const uploadDir = join(process.cwd(), 'public', 'uploads', 'invoice-bukti-pembayaran')
    const filepath = join(uploadDir, filename)

    const { mkdir, unlink } = await import('fs/promises')

    await mkdir(uploadDir, { recursive: true })

    if (oldFilePath) {
      try {
        const oldFullPath = join(process.cwd(), 'public', oldFilePath)

        await unlink(oldFullPath)
      } catch {
        // ignore if old file doesn't exist
      }
    }

    await writeFile(filepath, buffer)

    const publicUrl = `/uploads/invoice-bukti-pembayaran/${filename}`

    return NextResponse.json({
      message: 'File berhasil diupload',
      url: publicUrl,
      filename
    })
  } catch (error) {
    console.error('Upload error:', error)

    return NextResponse.json({ message: 'Gagal mengupload file' }, { status: 500 })
  }
}

export const POST = withAuth(handlePost)
