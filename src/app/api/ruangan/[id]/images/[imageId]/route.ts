import { NextRequest, NextResponse } from 'next/server'
import { unlink } from 'fs/promises'
import { join } from 'path'

import prisma from '@/src/libs/prisma'
import { withAuth, type AuthContext } from '@/src/libs/auth-middleware'

type ParamCtx = AuthContext & { params: { id: string; imageId: string } }

async function handleDelete(request: NextRequest, { user, params }: ParamCtx) {
  try {
    const { id: ruanganId, imageId } = params

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

    // Find the image
    const image = await prisma.ruanganImage.findFirst({
      where: {
        id: imageId,
        ruanganId
      }
    })

    if (!image) {
      return NextResponse.json({ message: 'Image tidak ditemukan' }, { status: 404 })
    }

    // Delete file from filesystem
    try {
      const fullPath = join(process.cwd(), 'public', image.filepath)

      await unlink(fullPath)
    } catch (error) {
      console.log('File not found or already deleted:', error)
    }

    // Delete database record
    await prisma.ruanganImage.delete({
      where: { id: imageId }
    })

    return NextResponse.json({
      message: 'Image deleted successfully'
    })
  } catch (error) {
    console.error('Delete image error:', error)

    return NextResponse.json({ message: 'Failed to delete image' }, { status: 500 })
  }
}

export const DELETE = withAuth<{ id: string; imageId: string }>(handleDelete)
