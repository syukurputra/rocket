import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/src/libs/prisma'
import { withAuth, type AuthContext } from '@/src/libs/auth-middleware'

type ParamCtx = AuthContext & { params: { id: string } }

async function handleGet(
  request: NextRequest,
  { params }: ParamCtx
) {
  try {
    const { id } = await params

    const tagihan = await prisma.tagihan.findUnique({
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
        }
      }
    })

    if (!tagihan) {
      return NextResponse.json(
        { message: 'Tagihan tidak ditemukan' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      data: tagihan,
      message: 'Data retrieved successfully'
    })

  } catch (error) {
    console.error('Get tagihan by ID error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function handlePut(
  request: NextRequest,
  { user, params }: ParamCtx
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { keterangan, mulaiSewa, selesaiSewa, status } = body

    const existingTagihan = await prisma.tagihan.findUnique({
      where: { id }
    })

    if (!existingTagihan) {
      return NextResponse.json(
        { message: 'Tagihan tidak ditemukan' },
        { status: 404 }
      )
    }

    let mulaiSewaDate = new Date()
    if (mulaiSewa) {
      mulaiSewaDate = new Date(mulaiSewa)
      if (isNaN(mulaiSewaDate.getTime())) {
        return NextResponse.json(
          { message: 'Format tanggal mulai sewa tidak valid' },
          { status: 400 }
        )
      }
    }

    let selesaiSewaDate = new Date()
    if (selesaiSewa) {
      selesaiSewaDate = new Date(selesaiSewa)
      if (isNaN(selesaiSewaDate.getTime())) {
        return NextResponse.json(
          { message: 'Format tanggal mulai sewa tidak valid' },
          { status: 400 }
        )
      }
    }

    const updatedRuangan = await prisma.ruangan.update({
      where: { id },
      data: {
        ...(keterangan && { keterangan }),
        ...(mulaiSewa && { mulaiSewaDate }),
        ...(selesaiSewa && { selesaiSewaDate }),
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
        }
      }
    })

    return NextResponse.json({
      data: updatedRuangan,
      message: 'Tagihan berhasil diupdate'
    })

  } catch (error) {
    console.error('Update tagihan error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function handleDelete(
  request: NextRequest,
  { params }: ParamCtx
) {
  try {
    const { id } = await params

    const existingTagihan = await prisma.tagihan.findUnique({
      where: { id }
    })

    if (!existingTagihan) {
      return NextResponse.json(
        { message: 'Tagihan tidak ditemukan' },
        { status: 404 }
      )
    }

    await prisma.tagihan.delete({
      where: { id }
    })

    return NextResponse.json({
      message: 'Tagihan berhasil dihapus'
    })

  } catch (error) {
    console.error('Delete tagihan error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export const GET    = withAuth<{ id: string }>(handleGet)
export const PUT    = withAuth<{ id: string }>(handlePut)
export const DELETE = withAuth<{ id: string }>(handleDelete)
