import { NextRequest, NextResponse } from 'next/server'
import { writeFile } from 'fs/promises'
import { join } from 'path'
import { withAuth, type AuthContext } from '@/src/libs/auth-middleware'

async function handlePost(request: NextRequest, { user }: AuthContext) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
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
      return NextResponse.json({ message: 'Tipe file tidak valid. Hanya JPG, PNG, dan PDF yang diizinkan' }, { status: 400 })
    }

    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return NextResponse.json({ message: 'Ukuran file melebihi batas 5MB' }, { status: 400 })
    }

    const extension = file.name.split('.').pop() || 'jpg'
    const filename = `${tagihanId}.${extension}`
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const uploadDir = join(process.cwd(), 'public', 'uploads', 'bukti-pembayaran')
    const filepath = join(uploadDir, filename)

    const { mkdir, unlink } = await import('fs/promises')
    await mkdir(uploadDir, { recursive: true })

    if (oldFilePath) {
      try {
        const oldFullPath = join(process.cwd(), 'public', oldFilePath)
        await unlink(oldFullPath)
      } catch (error) {
        console.log('File lama tidak ditemukan atau sudah dihapus')
      }
    }

    await writeFile(filepath, buffer)

    const publicUrl = `/uploads/bukti-pembayaran/${filename}`

    return NextResponse.json({
      message: 'File berhasil diupload',
      url: publicUrl,
      filename: filename
    })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ message: 'Gagal mengupload file' }, { status: 500 })
  }
}

export const POST = withAuth(handlePost)
