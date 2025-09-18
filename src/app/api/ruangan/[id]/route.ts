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
        }
      }
    })

    if (!ruangan) {
      return NextResponse.json(
        { message: 'Ruangan tidak ditemukan' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      data: ruangan,
      message: 'Data retrieved successfully'
    })

  } catch (error) {
    console.error('Get ruangan by ID error:', error)
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
    const { nama, status, nominal, asetId } = body

    const existingRuangan = await prisma.ruangan.findUnique({
      where: { id }
    })

    if (!existingRuangan) {
      return NextResponse.json(
        { message: 'Ruangan tidak ditemukan' },
        { status: 404 }
      )
    }

    const updatedRuangan = await prisma.ruangan.update({
      where: { id },
      data: {
        ...(nama && { nama }),
        ...(asetId && { asetId }),
        ...(nominal && { nominal }),
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
      message: 'Ruangan berhasil diupdate'
    })

  } catch (error) {
    console.error('Update ruangan error:', error)
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

    const existingRuangan = await prisma.ruangan.findUnique({
      where: { id }
    })

    if (!existingRuangan) {
      return NextResponse.json(
        { message: 'Ruangan tidak ditemukan' },
        { status: 404 }
      )
    }

    await prisma.ruangan.delete({
      where: { id }
    })

    return NextResponse.json({
      message: 'Ruangan berhasil dihapus'
    })

  } catch (error) {
    console.error('Delete ruangan error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export const GET    = withAuth<{ id: string }>(handleGet)
export const PUT    = withAuth<{ id: string }>(handlePut)
export const DELETE = withAuth<{ id: string }>(handleDelete)
