import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/src/libs/prisma'
import { withAuth, type AuthContext } from '@/src/libs/auth-middleware'

type ParamCtx = AuthContext & { params: { id: string } }

async function handleGet(request: NextRequest, { params }: ParamCtx) {
  try {
    const { id } = params

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
      return NextResponse.json({ message: 'Icon tidak ditemukan' }, { status: 404 })
    }

    return NextResponse.json({
      data: icon,
      message: 'Data berhasil diambil'
    })
  } catch (error) {
    console.error('Get icon by ID error:', error)
    return NextResponse.json({ message: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

async function handlePut(request: NextRequest, { user, params }: ParamCtx) {
  try {
    const { id } = params
    const body = await request.json()
    const { nama, code } = body

    const existingIcon = await prisma.masterIcon.findUnique({
      where: { id }
    })

    if (!existingIcon) {
      return NextResponse.json({ message: 'Icon tidak ditemukan' }, { status: 404 })
    }

    const updatedAset = await prisma.masterIcon.update({
      where: { id },
      data: {
        ...(nama && { nama }),
        ...(code && { code }),
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
      data: updatedAset,
      message: 'Icon berhasil diupdate'
    })
  } catch (error) {
    console.error('Update icon error:', error)
    return NextResponse.json({ message: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

async function handleDelete(request: NextRequest, { user, params }: ParamCtx) {
  try {
    const { id } = await params

    const existingIcon = await prisma.masterIcon.findUnique({
      where: { id }
    })

    if (!existingIcon) {
      return NextResponse.json({ message: 'Aset tidak ditemukan' }, { status: 404 })
    }

    await prisma.masterIcon.delete({
      where: { id }
    })

    return NextResponse.json({
      message: 'Icon berhasil dihapus'
    })
  } catch (error) {
    console.error('Delete icon error:', error)
    return NextResponse.json({ message: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

export const GET = withAuth<{ id: string }>(handleGet)
export const PUT = withAuth<{ id: string }>(handlePut)
export const DELETE = withAuth<{ id: string }>(handleDelete)
