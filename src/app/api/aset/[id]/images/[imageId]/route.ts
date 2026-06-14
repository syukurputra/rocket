import { NextRequest, NextResponse } from 'next/server'

import prisma from '@/src/libs/prisma'
import { withAuth, type AuthContext } from '@/src/libs/auth-middleware'
import { deleteFromS3, getS3KeyFromUrl } from '@/src/libs/s3'

type ParamCtx = AuthContext & { params: { id: string; imageId: string } }

async function handleDelete(request: NextRequest, { user, params }: ParamCtx) {
  try {
    const { id: asetId, imageId } = params

    // Verify aset exists and belongs to user's company
    const aset = await prisma.aset.findFirst({
      where: {
        id: asetId,
        companyId: user.companyId!
      }
    })

    if (!aset) {
      return NextResponse.json({ message: 'Aset tidak ditemukan' }, { status: 404 })
    }

    // Find the image
    const image = await prisma.asetImage.findFirst({
      where: {
        id: imageId,
        asetId
      }
    })

    if (!image) {
      return NextResponse.json({ message: 'Image tidak ditemukan' }, { status: 404 })
    }

    // Delete file from S3 Object Storage
    try {
      const s3Key = getS3KeyFromUrl(image.filepath)

      if (s3Key) {
        await deleteFromS3(s3Key)
      } else {
        // Fallback: try to delete from local filesystem for old images
        const { unlink } = await import('fs/promises')
        const { join } = await import('path')
        const fullPath = join(process.cwd(), 'public', image.filepath)

        await unlink(fullPath)
      }
    } catch (error) {
      console.log('File not found or already deleted:', error)
    }

    // Delete database record
    await prisma.asetImage.delete({
      where: { id: imageId }
    })

    return NextResponse.json({
      message: 'Gambar berhasil dihapus'
    })
  } catch (error) {
    console.error('Delete image error:', error)

    return NextResponse.json({ message: 'Gagal menghapus gambar' }, { status: 500 })
  }
}

export const DELETE = withAuth<{ id: string; imageId: string }>(handleDelete)
