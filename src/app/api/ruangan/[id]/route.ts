import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/src/libs/prisma'
import { extractTokenFromRequest, verifyAccessToken } from '@/src/libs/jwt'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = extractTokenFromRequest(request)

    if (!token) {
      return NextResponse.json(
        { message: 'Access token required' },
        { status: 401 }
      )
    }

    const payload = verifyAccessToken(token)

    if (!payload) {
      return NextResponse.json(
        { message: 'Invalid or expired token' },
        { status: 401 }
      )
    }

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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = extractTokenFromRequest(request)

    if (!token) {
      return NextResponse.json(
        { message: 'Access token required' },
        { status: 401 }
      )
    }

    const payload = verifyAccessToken(token)

    if (!payload) {
      return NextResponse.json(
        { message: 'Invalid or expired token' },
        { status: 401 }
      )
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: payload.userId }
    })

    if (!currentUser) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      )
    }

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
        ...(status !== undefined && { status: Boolean(status) }),
        updatedById: currentUser.id
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = extractTokenFromRequest(request)

    if (!token) {
      return NextResponse.json(
        { message: 'Access token required' },
        { status: 401 }
      )
    }

    const payload = verifyAccessToken(token)

    if (!payload) {
      return NextResponse.json(
        { message: 'Invalid or expired token' },
        { status: 401 }
      )
    }

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
