import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import prisma from '@/src/libs/prisma'
import { withAuth, type AuthContext } from '@/src/libs/auth-middleware'
import { deleteFromS3, getS3KeyFromUrl } from '@/src/libs/s3'

type ParamCtx = AuthContext & { params: { id: string } }

async function handleGet(request: NextRequest, { params }: ParamCtx) {
  try {
    const { id } = params

    const aset = await prisma.aset.findUnique({
      where: { id },
      include: {
        images: true,
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
        }
      }
    })

    if (!aset) {
      return NextResponse.json({ message: 'Aset tidak ditemukan' }, { status: 404 })
    }

    return NextResponse.json({
      data: aset,
      message: 'Data berhasil diambil'
    })
  } catch (error) {
    console.error('Get aset by ID error:', error)

    return NextResponse.json({ message: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

async function handlePut(request: NextRequest, { user, params }: ParamCtx) {
  try {
    const { id } = await params
    const body = await request.json()
    const { jenis, nama, deskripsi, alamat, kota, provinsi, kecamatan, kelurahan, latitude, longitude, status, bookingOnline, pembayaranOnline } = body

    const existingAset = await prisma.aset.findUnique({
      where: { id }
    })

    if (!existingAset) {
      return NextResponse.json({ message: 'Aset tidak ditemukan' }, { status: 404 })
    }

    const updatedAset = await prisma.aset.update({
      where: { id },
      data: {
        jenis,
        nama,
        deskripsi,
        alamat,
        kota,
        provinsi,
        kecamatan,
        kelurahan,
        latitude: latitude !== undefined ? Number(latitude) : undefined,
        longitude: longitude !== undefined ? Number(longitude) : undefined,
        updatedById: user.id,
        ...(status && { status }),
        ...(bookingOnline !== undefined && { bookingOnline: bookingOnline === true }),
        ...(pembayaranOnline !== undefined && { pembayaranOnline: pembayaranOnline === true })
      },
      include: {
        images: true,
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
        }
      }
    })

    return NextResponse.json({
      data: updatedAset,
      message: 'Aset berhasil diupdate'
    })
  } catch (error) {
    console.error('Update aset error:', error)

    return NextResponse.json({ message: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

async function handleDelete(request: NextRequest, { user, params }: ParamCtx) {
  try {
    const { id } = await params

    const existingAset = await prisma.aset.findUnique({
      where: { id },
      include: {
        images: true,
        ruangan: {
          include: {
            images: true
          }
        }
      }
    })

    if (!existingAset) {
      return NextResponse.json({ message: 'Aset tidak ditemukan' }, { status: 404 })
    }

    // Check ownership
    if (existingAset.companyId !== user.companyId) {
      return NextResponse.json({ message: 'Akses tidak diizinkan' }, { status: 403 })
    }

    // Delete all aset images from S3
    for (const image of existingAset.images) {
      try {
        const s3Key = getS3KeyFromUrl(image.filepath)

        if (s3Key) {
          await deleteFromS3(s3Key)
        }
      } catch (err) {
        console.error(`Failed to delete aset image from S3: ${image.filepath}`, err)
      }
    }

    // Delete all item aset (ruangan) images from S3
    for (const ruangan of existingAset.ruangan) {
      for (const image of ruangan.images) {
        try {
          const s3Key = getS3KeyFromUrl(image.filepath)

          if (s3Key) {
            await deleteFromS3(s3Key)
          }
        } catch (err) {
          console.error(`Failed to delete item aset image from S3: ${image.filepath}`, err)
        }
      }
    }

    // Delete aset from DB (cascade will remove images, ruangan, etc. from DB)
    await prisma.aset.delete({
      where: { id }
    })

    return NextResponse.json({
      message: 'Aset berhasil dihapus'
    })
  } catch (error) {
    console.error('Delete aset error:', error)

    return NextResponse.json({ message: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

export const GET = withAuth<{ id: string }>(handleGet)
export const PUT = withAuth<{ id: string }>(handlePut)
export const DELETE = withAuth<{ id: string }>(handleDelete)
