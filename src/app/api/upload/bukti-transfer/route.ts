import { NextRequest, NextResponse } from 'next/server'

import { withAuth, type AuthContext } from '@/src/libs/auth-middleware'
import { uploadToS3, deleteFromS3, getS3KeyFromUrl } from '@/src/libs/s3'

export const runtime = 'nodejs'

async function deleteOldFile(oldFilePath: string) {
  if (!oldFilePath) return

  const oldKey = getS3KeyFromUrl(oldFilePath)

  if (oldKey) {
    await deleteFromS3(oldKey).catch(() => {})
  }
}

// POST /api/upload/bukti-transfer — upload bukti transfer (admin, untuk tarik saldo)
async function handlePost(request: NextRequest, { user }: AuthContext) {
  try {
    const isSuperAdmin =
      user.roleId === 'superadmin' ||
      user.role?.nama?.toLowerCase().replace(/\s+/g, '') === 'superadmin'

    if (!isSuperAdmin) {
      return NextResponse.json({ message: 'Akses ditolak' }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const tarikSaldoId = formData.get('tarikSaldoId') as string
    const oldFilePath = formData.get('oldFilePath') as string

    if (!file) {
      return NextResponse.json({ message: 'Tidak ada file yang diupload' }, { status: 400 })
    }

    if (!tarikSaldoId) {
      return NextResponse.json({ message: 'ID Tarik Saldo wajib diisi' }, { status: 400 })
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

    if (oldFilePath) await deleteOldFile(oldFilePath)

    const extension = (file.name.split('.').pop() || 'jpg').toLowerCase()
    const key = `bukti-transfer/${tarikSaldoId}-${Date.now()}.${extension}`
    const buffer = Buffer.from(await file.arrayBuffer())

    const url = await uploadToS3(buffer, key, file.type)

    return NextResponse.json({
      message: 'File berhasil diupload',
      url,
      filename: key.split('/').pop()
    })
  } catch (error) {
    console.error('Upload bukti transfer error:', error)

    return NextResponse.json({ message: 'Gagal mengupload file' }, { status: 500 })
  }
}

export const POST = withAuth(handlePost)
