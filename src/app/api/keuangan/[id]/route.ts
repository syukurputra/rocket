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

    const keuangan = await prisma.keuangan.findUnique({
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

    if (!keuangan) {
      return NextResponse.json(
        { message: 'Keuangan tidak ditemukan' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      data: keuangan,
      message: 'Data retrieved successfully'
    })

  } catch (error) {
    console.error('Get keuangan by ID error:', error)
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
    const { jenis, keterangan, nominal, asetId, iconId, tanggal } = body

    let transactionDate = new Date()
    if (tanggal) {
      transactionDate = new Date(tanggal)
      if (isNaN(transactionDate.getTime())) {
        return NextResponse.json(
          { message: 'Format tanggal tidak valid' },
          { status: 400 }
        )
      }
    }

    const existingKeuangan = await prisma.keuangan.findUnique({
      where: { id }
    })

    if (!existingKeuangan) {
      return NextResponse.json(
        { message: 'Keuangan tidak ditemukan' },
        { status: 404 }
      )
    }

    const updatedKeuangan = await prisma.keuangan.update({
      where: { id },
      data: {
        ...(jenis && { jenis }),
        ...(keterangan && { keterangan }),
        ...(nominal && { nominal }),
        ...(asetId && { asetId }),
        ...(iconId && { iconId }),
        ...(tanggal && { transactionDate }),
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
      data: updatedKeuangan,
      message: 'Keuangan berhasil diupdate'
    })

  } catch (error) {
    console.error('Update keuangan error:', error)
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

    const existingKeuangan = await prisma.keuangan.findUnique({
      where: { id }
    })

    if (!existingKeuangan) {
      return NextResponse.json(
        { message: 'Keuangan tidak ditemukan' },
        { status: 404 }
      )
    }

    await prisma.keuangan.delete({
      where: { id }
    })

    return NextResponse.json({
      message: 'Keuangan berhasil dihapus'
    })

  } catch (error) {
    console.error('Delete keuangan error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

