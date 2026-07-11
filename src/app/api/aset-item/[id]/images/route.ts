import { NextRequest, NextResponse } from 'next/server'

import prisma from '@/src/libs/prisma'
import { withAuth, type AuthContext } from '@/src/libs/auth-middleware'
import { uploadToS3 } from '@/src/libs/s3'

type ParamCtx = AuthContext & { params: { id: string } }

async function handlePost(request: NextRequest, { user, params }: ParamCtx) {
  try {
    const { id: ruanganId } = params
    console.log('[item-images] ruanganId:', ruanganId, 'companyId:', user.companyId)

    // Verify item aset exists and belongs to this user (or same company)
    const ruangan = await prisma.ruangan.findFirst({
      where: {
        id: ruanganId,
        OR: [
          { createdById: user.id },
          ...(user.companyId ? [{ companyId: user.companyId }] : [])
        ]
      }
    })

    console.log('[item-images] ruangan found:', !!ruangan)

    if (!ruangan) {
      return NextResponse.json({ message: 'Item aset tidak ditemukan' }, { status: 404 })
    }

    const formData = await request.formData()
    const files = formData.getAll('files') as File[]

    console.log('[item-images] files count:', files.length, 'types:', files.map(f => f.type))

    if (!files || files.length === 0) {
      return NextResponse.json({ message: 'Tidak ada file yang diupload' }, { status: 400 })
    }

    // Validate max 3 images
    const existingImagesCount = await prisma.ruanganImage.count({ where: { ruanganId } })

    if (existingImagesCount + files.length > 3) {
      return NextResponse.json(
        { message: `Maksimal 3 gambar. Saat ini sudah ada ${existingImagesCount} gambar.` },
        { status: 400 }
      )
    }

    const uploadedImages = []

    for (const file of files) {
      // Accept any image type (not just the fixed list)
      if (!file.type.startsWith('image/') && file.type !== '') {
        console.log('[item-images] skipping non-image file:', file.name, file.type)
        continue
      }

      const maxSize = 5 * 1024 * 1024
      if (file.size > maxSize) {
        return NextResponse.json({ message: `File "${file.name}" terlalu besar. Maksimal 5MB per file.` }, { status: 400 })
      }

      const timestamp = Date.now()
      const extension = file.name.split('.').pop() || 'jpg'
      const filename = `${ruanganId}_${timestamp}_${Math.random().toString(36).substring(7)}.${extension}`
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)
      const s3Key = `item-aset/${filename}`

      console.log('[item-images] uploading to S3:', s3Key)
      const publicUrl = await uploadToS3(buffer, s3Key, file.type || 'image/jpeg')
      console.log('[item-images] S3 URL:', publicUrl)

      const imageRecord = await prisma.ruanganImage.create({
        data: {
          filename: file.name,
          filepath: publicUrl,
          filesize: file.size,
          mimetype: file.type,
          ruanganId
        }
      })

      console.log('[item-images] DB record created:', imageRecord.id)
      uploadedImages.push(imageRecord)
    }

    if (uploadedImages.length === 0) {
      return NextResponse.json({ message: 'Tidak ada file valid yang berhasil diupload (cek tipe/ukuran)' }, { status: 400 })
    }

    return NextResponse.json({
      message: `${uploadedImages.length} gambar berhasil diupload`,
      data: uploadedImages
    })
  } catch (error) {
    console.error('[item-images] Upload error:', error)
    return NextResponse.json({ message: `Gagal mengupload gambar: ${error instanceof Error ? error.message : String(error)}` }, { status: 500 })
  }
}

export const POST = withAuth<{ id: string }>(handlePost)
