import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/src/libs/prisma'
import { withAuth, type AuthContext } from '@/src/libs/auth-middleware'
import { deleteFromS3, getS3KeyFromUrl } from '@/src/libs/s3'

type ParamCtx = AuthContext & { params: { id: string } }

// DELETE /api/aset-image/[id]
async function handleDelete(request: NextRequest, { user, params }: ParamCtx) {
  try {
    const { id } = params // This is the asetImage ID by convention of the folder structure

    // Find the image
    const image = await prisma.asetImage.findUnique({
      where: { id },
      include: { aset: true }
    })

    if (!image) {
      return NextResponse.json({ message: 'Image not found' }, { status: 404 })
    }

    // Check ownership via Aset -> Company
    // The aset must belong to the user's company
    if (image.aset.companyId !== user.companyId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 403 })
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
        const absolutePath = join(process.cwd(), 'public', image.filepath)

        await unlink(absolutePath)
      }
    } catch (err: any) {
      console.error(`Failed to delete file: ${image.filepath}`, err)
      // Continue to delete from DB even if file delete fails (orphaned record prevention)
    }

    // Delete from Database
    await prisma.asetImage.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Image deleted successfully' })
  } catch (error) {
    console.error('Delete image error:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

export const DELETE = withAuth<{ id: string }>(handleDelete)
