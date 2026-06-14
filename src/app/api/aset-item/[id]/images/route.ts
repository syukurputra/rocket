import { NextRequest, NextResponse } from 'next/server'

import prisma from '@/src/libs/prisma'
import { withAuth, type AuthContext } from '@/src/libs/auth-middleware'
import { uploadToS3 } from '@/src/libs/s3'

type ParamCtx = AuthContext & { params: { id: string } }

async function handlePost(request: NextRequest, { user, params }: ParamCtx) {
  try {
    const { id: ruanganId } = params

    // Verify ruangan exists and belongs to user's company
    const ruangan = await prisma.ruangan.findFirst({
      where: {
        id: ruanganId,
        companyId: user.companyId!
      }
    })

    if (!ruangan) {
      return NextResponse.json({ message: 'Item aset tidak ditemukan' }, { status: 404 })
    }

    const formData = await request.formData()
    const files = formData.getAll('files') as File[]

    if (!files || files.length === 0) {
      return NextResponse.json({ message: 'Tidak ada file yang diupload' }, { status: 400 })
    }

    // Validate max 3 images
    const existingImagesCount = await prisma.ruanganImage.count({
      where: { ruanganId }
    })

    if (existingImagesCount + files.length > 3) {
      return NextResponse.json(
        { message: `Maksimal 3 gambar. Saat ini sudah ada ${existingImagesCount} gambar.` },
        { status: 400 }
      )
    }

    const uploadedImages = []

    for (const file of files) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp']

      if (!allowedTypes.includes(file.type)) {
        continue // Skip invalid files
      }

      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024 // 5MB

      if (file.size > maxSize) {
        continue // Skip files that are too large
      }

      // Generate unique filename
      const timestamp = Date.now()
      const extension = file.name.split('.').pop() || 'jpg'
      const filename = `${ruanganId}_${timestamp}_${Math.random().toString(36).substring(7)}.${extension}`

      // Convert file to buffer
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)

      // Upload to S3 Object Storage
      const s3Key = `item-aset/${filename}`
      const publicUrl = await uploadToS3(buffer, s3Key, file.type)

      // Create database record with S3 URL
      const imageRecord = await prisma.ruanganImage.create({
        data: {
          filename: file.name,
          filepath: publicUrl,
          filesize: file.size,
          mimetype: file.type,
          ruanganId
        }
      })

      uploadedImages.push(imageRecord)
    }

    return NextResponse.json({
      message: `${uploadedImages.length} gambar berhasil diupload`,
      data: uploadedImages
    })
  } catch (error) {
    console.error('Upload error:', error)

    return NextResponse.json({ message: 'Gagal mengupload gambar' }, { status: 500 })
  }
}

export const POST = withAuth<{ id: string }>(handlePost)
