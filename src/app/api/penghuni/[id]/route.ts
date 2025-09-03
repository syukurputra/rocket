import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/src/libs/prisma'
import { withAuth, type AuthContext } from '@/src/libs/auth-middleware'

type ParamCtx = AuthContext & { params: { id: string } }

async function handleGet(
  request: NextRequest,
  { params }: ParamCtx
) {
  try {
    const { id } = params

    const penghuni = await prisma.penghuni.findUnique({
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

    if (!penghuni) {
      return NextResponse.json(
        { message: 'Penghuni tidak ditemukan' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      data: penghuni,
      message: 'Data retrieved successfully'
    })

  } catch (error) {
    console.error('Get penghuni by ID error:', error)
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
    const { id } = params
    const body = await request.json()
    const { nama, status, mulaiHuni, selesaiHuni, asetId, ruanganId } = body

    let mulaiHuniDate = new Date()
    if (mulaiHuni) {
      mulaiHuniDate = new Date(mulaiHuni)
      if (isNaN(mulaiHuniDate.getTime())) {
        return NextResponse.json(
          { message: 'Format tanggal mulai huni tidak valid' },
          { status: 400 }
        )
      }
    }

    let selesaiHuniDate = new Date()
    if (selesaiHuni) {
      selesaiHuniDate = new Date(selesaiHuni)
      if (isNaN(selesaiHuniDate.getTime())) {
        return NextResponse.json(
          { message: 'Format tanggal mulai huni tidak valid' },
          { status: 400 }
        )
      }
    }

    const existingPenghuni = await prisma.penghuni.findUnique({
      where: { id }
    })

    if (!existingPenghuni) {
      return NextResponse.json(
        { message: 'Penghuni tidak ditemukan' },
        { status: 404 }
      )
    }

    const updatedPenghuni = await prisma.penghuni.update({
      where: { id },
      data: {
        ...(nama && { nama }),
        ...(status && { status }),
        ...(mulaiHuni && { mulaiHuniDate }),
        ...(selesaiHuni && { selesaiHuniDate }),
        ...(asetId && { asetId }),
        ...(ruanganId && { ruanganId }),
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
      data: updatedPenghuni,
      message: 'Penghuni berhasil diupdate'
    })

  } catch (error) {
    console.error('Update penghuni error:', error)
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
    const { id } = params

    const existingPenghuni = await prisma.penghuni.findUnique({
      where: { id }
    })

    if (!existingPenghuni) {
      return NextResponse.json(
        { message: 'Penghuni tidak ditemukan' },
        { status: 404 }
      )
    }

    await prisma.penghuni.delete({
      where: { id }
    })

    return NextResponse.json({
      message: 'Penghuni berhasil dihapus'
    })

  } catch (error) {
    console.error('Delete penghuni error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export const GET    = withAuth<{ id: string }>(handleGet)
export const PUT    = withAuth<{ id: string }>(handlePut)
export const DELETE = withAuth<{ id: string }>(handleDelete)
