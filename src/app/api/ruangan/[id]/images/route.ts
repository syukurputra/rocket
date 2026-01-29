import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'

import prisma from '@/src/libs/prisma'
import { withAuth, type AuthContext } from '@/src/libs/auth-middleware'

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
      return NextResponse.json({ message: 'Ruangan tidak ditemukan' }, { status: 404 })
    }

    const formData = await request.formData()
    const files = formData.getAll('files') as File[]

    if (!files || files.length === 0) {
      return NextResponse.json({ message: 'No files uploaded' }, { status: 400 })
    }

    // Validate max 10 images
    const existingImagesCount = await prisma.ruanganImage.count({
      where: { ruanganId }
    })

    if (existingImagesCount + files.length > 3) {
      return NextResponse.json(
        { message: `Maximum 3 images allowed. You have ${existingImagesCount} images already.` },
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

      // Save to public/uploads/ruangan
      const uploadDir = join(process.cwd(), 'public', 'uploads', 'ruangan')

      await mkdir(uploadDir, { recursive: true })

      const filepath = join(uploadDir, filename)

      await writeFile(filepath, buffer)

      // Create database record
      const publicPath = `/uploads/ruangan/${filename}`
      const imageRecord = await prisma.ruanganImage.create({
        data: {
          filename: file.name,
          filepath: publicPath,
          filesize: file.size,
          mimetype: file.type,
          ruanganId
        }
      })

      uploadedImages.push(imageRecord)
    }

    return NextResponse.json({
      message: `${uploadedImages.length} image(s) uploaded successfully`,
      data: uploadedImages
    })
  } catch (error) {
    console.error('Upload error:', error)

    return NextResponse.json({ message: 'Failed to upload images' }, { status: 500 })
  }
}

export const POST = withAuth<{ id: string }>(handlePost)
