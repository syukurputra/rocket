import { NextRequest, NextResponse } from 'next/server'
import { unlink } from 'fs/promises'
import { join } from 'path'
import prisma from '@/src/libs/prisma'
import { withAuth, type AuthContext } from '@/src/libs/auth-middleware'

type ParamCtx = AuthContext & { params: { id: string } }

// DELETE /api/ruangan-image/[id]
async function handleDelete(request: NextRequest, { user, params }: ParamCtx) {
  try {
    const { id } = await params

    // Find the image
    const image = await prisma.ruanganImage.findUnique({
      where: { id },
      include: { ruangan: true }
    })

    if (!image) {
      return NextResponse.json({ message: 'Image not found' }, { status: 404 })
    }

    // Check ownership via Ruangan -> Company
    // The ruangan must belong to the user's company
    const ruangan = await prisma.ruangan.findUnique({
      where: { id: image.ruanganId }
    })

    if (!ruangan || ruangan.companyId !== user.companyId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 403 })
    }

    // Delete file from filesystem
    try {
      const absolutePath = join(process.cwd(), 'public', image.filepath)
      await unlink(absolutePath)
    } catch (err: any) {
      console.error(`Failed to delete file: ${image.filepath}`, err)
      // Continue to delete from DB even if file delete fails
    }

    // Delete from Database
    await prisma.ruanganImage.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Image deleted successfully' })
  } catch (error) {
    console.error('Delete image error:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

export const DELETE = withAuth<{ id: string }>(handleDelete)
