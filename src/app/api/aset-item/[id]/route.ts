import { NextRequest, NextResponse } from 'next/server'

import prisma from '@/src/libs/prisma'
import { withAuth, type AuthContext } from '@/src/libs/auth-middleware'
import { deleteFromS3, getS3KeyFromUrl } from '@/src/libs/s3'

type ParamCtx = AuthContext & { params: { id: string } }

async function handleGet(request: NextRequest, { params }: ParamCtx) {
  try {
    const { id } = await params

    const ruangan = await prisma.ruangan.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: {
            id: true,
            username: true
          }
        },
        updatedBy: {
          select: {
            id: true,
            username: true
          }
        },
        images: true
      }
    })

    if (!ruangan) {
      return NextResponse.json({ message: 'Item aset tidak ditemukan' }, { status: 404 })
    }

    return NextResponse.json({
      data: ruangan,
      message: 'Data berhasil diambil'
    })
  } catch (error) {
    console.error('Get aset-item by ID error:', error)

    return NextResponse.json({ message: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

async function handlePut(request: NextRequest, { user, params }: ParamCtx) {
  try {
    const { id } = await params
    const body = await request.json()
    const { nama, deskripsi, status, asetId } = body

    const existingRuangan = await prisma.ruangan.findUnique({
      where: { id }
    })

    if (!existingRuangan) {
      return NextResponse.json({ message: 'Item aset tidak ditemukan' }, { status: 404 })
    }

    const updatedRuangan = await prisma.ruangan.update({
      where: { id },
      data: {
        ...(nama && { nama }),
        ...(deskripsi !== undefined && { deskripsi }),
        ...(asetId && { asetId }),
        ...(status && { status }),
        updatedById: user.id
      },
      include: {
        createdBy: {
          select: {
            id: true,
            username: true
          }
        },
        updatedBy: {
          select: {
            id: true,
            username: true
          }
        },
        images: true
      }
    })

    return NextResponse.json({
      data: updatedRuangan,
      message: 'Item aset berhasil diupdate'
    })
  } catch (error) {
    console.error('Update aset-item error:', error)

    return NextResponse.json({ message: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

async function handleDelete(request: NextRequest, { user, params }: ParamCtx) {
  try {
    const { id } = await params

    const existingRuangan = await prisma.ruangan.findUnique({
      where: { id },
      include: {
        images: true
      }
    })

    if (!existingRuangan) {
      return NextResponse.json({ message: 'Item aset tidak ditemukan' }, { status: 404 })
    }

    // Check ownership
    if (existingRuangan.companyId !== user.companyId) {
      return NextResponse.json({ message: 'Akses tidak diizinkan' }, { status: 403 })
    }

    // Delete all item aset images from S3 before deleting the record
    for (const image of existingRuangan.images) {
      try {
        const s3Key = getS3KeyFromUrl(image.filepath)

        if (s3Key) {
          await deleteFromS3(s3Key)
        }
      } catch (err) {
        console.error(`Failed to delete item aset image from S3: ${image.filepath}`, err)
      }
    }

    // Delete from DB (cascade will remove images, fasilitas, harga from DB)
    await prisma.ruangan.delete({
      where: { id }
    })

    return NextResponse.json({
      message: 'Item aset berhasil dihapus'
    })
  } catch (error) {
    console.error('Delete aset-item error:', error)

    return NextResponse.json({ message: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

export const GET = withAuth<{ id: string }>(handleGet)
export const PUT = withAuth<{ id: string }>(handlePut)
export const DELETE = withAuth<{ id: string }>(handleDelete)
