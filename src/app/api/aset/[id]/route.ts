import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import prisma from '@/src/libs/prisma'
import { withAuth, type AuthContext } from '@/src/libs/auth-middleware'

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
      message: 'Data retrieved successfully'
    })
  } catch (error) {
    console.error('Get aset by ID error:', error)

    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

async function handlePut(request: NextRequest, { user, params }: ParamCtx) {
  try {
    const { id } = await params
    const body = await request.json()
    const { jenis, nama, deskripsi, alamat, kota, provinsi, kecamatan, kelurahan, latitude, longitude, status } = body

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
        ...(status && { status })
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

    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

async function handleDelete(request: NextRequest, { params }: ParamCtx) {
  try {
    const { id } = await params

    const existingAset = await prisma.aset.findUnique({
      where: { id }
    })

    if (!existingAset) {
      return NextResponse.json({ message: 'Aset tidak ditemukan' }, { status: 404 })
    }

    await prisma.aset.delete({
      where: { id }
    })

    return NextResponse.json({
      message: 'Aset berhasil dihapus'
    })
  } catch (error) {
    console.error('Delete aset error:', error)

    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

export const GET = withAuth<{ id: string }>(handleGet)
export const PUT = withAuth<{ id: string }>(handlePut)
export const DELETE = withAuth<{ id: string }>(handleDelete)
