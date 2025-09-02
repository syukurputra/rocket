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

    const currentUser = await prisma.penghuni.findUnique({
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

