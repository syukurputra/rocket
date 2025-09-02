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

    const icon = await prisma.masterIcon.findUnique({
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

    if (!icon) {
      return NextResponse.json(
        { message: 'Icon tidak ditemukan' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      data: icon,
      message: 'Data retrieved successfully'
    })

  } catch (error) {
    console.error('Get icon by ID error:', error)
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
    const { nama, jenis, code, color } = body

    const existingIcon = await prisma.masterIcon.findUnique({
      where: { id }
    })

    if (!existingIcon) {
      return NextResponse.json(
        { message: 'Icon tidak ditemukan' },
        { status: 404 }
      )
    }

    const updatedAset = await prisma.masterIcon.update({
      where: { id },
      data: {
        ...(nama && { nama }),
        ...(jenis && { jenis }),
        ...(code && { code }),
        ...(color && { color }),
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
      message: 'Icon berhasil diupdate'
    })

  } catch (error) {
    console.error('Update icon error:', error)
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

    const existingIcon = await prisma.masterIcon.findUnique({
      where: { id }
    })

    if (!existingIcon) {
      return NextResponse.json(
        { message: 'Aset tidak ditemukan' },
        { status: 404 }
      )
    }

    await prisma.masterIcon.delete({
      where: { id }
    })

    return NextResponse.json({
      message: 'Icon berhasil dihapus'
    })

  } catch (error) {
    console.error('Delete icon error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
