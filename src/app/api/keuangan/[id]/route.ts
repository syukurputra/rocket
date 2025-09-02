import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/src/libs/prisma'
import { withAuth, type AuthContext } from '@/src/libs/auth-middleware'

async function handleGet(
  request: NextRequest,
  { user, payload }: AuthContext,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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

async function handlePut(
  request: NextRequest,
  { user, payload }: AuthContext,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await prisma.user.findUnique({
      where: { id: user.id }
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

    let nominalValue: number
    if (typeof nominal === 'string') {
      // Handle string dengan separator (misalnya "1,000.50")
      const cleanedNominal = nominal.replace(/,/g, '')
      nominalValue = parseFloat(cleanedNominal)
    } else {
      nominalValue = nominal
    }

    const updatedKeuangan = await prisma.keuangan.update({
      where: { id },
      data: {
        jenis,
        keterangan: keterangan || '',
        nominal: nominalValue,
        asetId,
        iconId,
        tanggal: transactionDate,
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

async function handleDelete(
  request: NextRequest,
  { user, payload }: AuthContext,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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

export const GET = withAuth(handleGet)
export const PUT = withAuth(handlePut)
export const DELETE = withAuth(handleDelete)

