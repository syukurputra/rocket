import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/src/libs/prisma'
import { withAuth, type AuthContext } from '@/src/libs/auth-middleware'
import { uploadToS3 } from '@/src/libs/s3'

type ParamCtx = AuthContext & { params: { id: string } }

async function handlePost(request: NextRequest, { user, params }: ParamCtx) {
  try {
    const { id: asetId } = params
    console.log('[aset-images] asetId:', asetId, 'companyId:', user.companyId)

    // Verify aset exists and belongs to this user (or same company)
    const aset = await prisma.aset.findFirst({
      where: {
        id: asetId,
        OR: [
          { createdById: user.id },
          ...(user.companyId ? [{ companyId: user.companyId }] : [])
        ]
      }
    })

    console.log('[aset-images] aset found:', !!aset)

    if (!aset) {
      return NextResponse.json({ message: 'Aset tidak ditemukan' }, { status: 404 })
    }

    const formData = await request.formData()
    const files = formData.getAll('files') as File[]

    console.log('[aset-images] files count:', files.length, 'types:', files.map(f => f.type))

    if (!files || files.length === 0) {
      return NextResponse.json({ message: 'Tidak ada file yang diupload' }, { status: 400 })
    }

    const existingImagesCount = await prisma.asetImage.count({ where: { asetId } })

    if (existingImagesCount + files.length > 3) {
      return NextResponse.json(
        { message: `Maksimal 3 gambar. Saat ini sudah ada ${existingImagesCount} gambar.` },
        { status: 400 }
      )
    }

    const uploadedImages = []

    for (const file of files) {
      if (!file.type.startsWith('image/') && file.type !== '') {
        console.log('[aset-images] skipping non-image file:', file.name, file.type)
        continue
      }

      const maxSize = 5 * 1024 * 1024
      if (file.size > maxSize) {
        return NextResponse.json({ message: `File "${file.name}" terlalu besar. Maksimal 5MB per file.` }, { status: 400 })
      }

      const timestamp = Date.now()
      const extension = file.name.split('.').pop() || 'jpg'
      const filename = `${asetId}_${timestamp}_${Math.random().toString(36).substring(7)}.${extension}`
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)
      const s3Key = `aset/${filename}`

      console.log('[aset-images] uploading to S3:', s3Key)
      const publicUrl = await uploadToS3(buffer, s3Key, file.type || 'image/jpeg')
      console.log('[aset-images] S3 URL:', publicUrl)

      const imageRecord = await prisma.asetImage.create({
        data: {
          filename: file.name,
          filepath: publicUrl,
          filesize: file.size,
          mimetype: file.type,
          asetId
        }
      })

      console.log('[aset-images] DB record created:', imageRecord.id)
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
    console.error('[aset-images] Upload error:', error)
    return NextResponse.json({ message: `Gagal mengupload gambar: ${error instanceof Error ? error.message : String(error)}` }, { status: 500 })
  }
}

export const POST = withAuth<{ id: string }>(handlePost)
