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

    // Find aset dengan user relations
    const aset = await prisma.aset.findUnique({
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

    if (!aset) {
      return NextResponse.json(
        { message: 'Aset tidak ditemukan' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      data: aset,
      message: 'Data retrieved successfully'
    })

  } catch (error) {
    console.error('Get aset by ID error:', error)
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

    // Get current user
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
    const { jenis, nama, alamat, kota, provinsi, status } = body

    // Check if aset exists
    const existingAset = await prisma.aset.findUnique({
      where: { id }
    })

    if (!existingAset) {
      return NextResponse.json(
        { message: 'Aset tidak ditemukan' },
        { status: 404 }
      )
    }

    // Update aset
    const updatedAset = await prisma.aset.update({
      where: { id },
      data: {
        ...(jenis && { jenis }),
        ...(nama && { nama }),
        ...(alamat && { alamat }),
        ...(kota && { kota }),
        ...(provinsi && { provinsi }),
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
      data: updatedAset,
      message: 'Aset berhasil diupdate'
    })

  } catch (error) {
    console.error('Update aset error:', error)
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

    // Check if aset exists
    const existingAset = await prisma.aset.findUnique({
      where: { id }
    })

    if (!existingAset) {
      return NextResponse.json(
        { message: 'Aset tidak ditemukan' },
        { status: 404 }
      )
    }

    // Hard delete aset
    await prisma.aset.delete({
      where: { id }
    })

    return NextResponse.json({
      message: 'Aset berhasil dihapus'
    })

  } catch (error) {
    console.error('Delete aset error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

