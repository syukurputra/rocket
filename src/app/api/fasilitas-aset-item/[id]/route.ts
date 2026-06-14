import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import prisma from '@/src/libs/prisma'
import { withAuth, type AuthContext } from '@/src/libs/auth-middleware'

type ParamCtx = AuthContext & { params: { id: string } }

async function handlePut(request: NextRequest, { user, params }: ParamCtx) {
  try {
    const { id } = await params
    const body = await request.json()
    const { nama, iconId, ruanganId } = body

    const existingFasilitas = await prisma.fasilitasRuangan.findUnique({
      where: { id }
    })

    if (!existingFasilitas) {
      return NextResponse.json({ message: 'Fasilitas item aset tidak ditemukan' }, { status: 404 })
    }

    const updatedFasilitas = await prisma.fasilitasRuangan.update({
      where: { id },
      data: {
        nama,
        iconId,
        ruanganId
      },
      include: {
        icon: true,
        ruangan: {
          select: {
            id: true,
            nama: true
          }
        }
      }
    })

    return NextResponse.json({
      data: updatedFasilitas,
      message: 'Fasilitas item aset berhasil diupdate'
    })
  } catch (error) {
    console.error('Update fasilitas aset-item error:', error)

    return NextResponse.json({ message: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

async function handleDelete(request: NextRequest, { params }: ParamCtx) {
  try {
    const { id } = await params

    const existingFasilitas = await prisma.fasilitasRuangan.findUnique({
      where: { id }
    })

    if (!existingFasilitas) {
      return NextResponse.json({ message: 'Fasilitas item aset tidak ditemukan' }, { status: 404 })
    }

    await prisma.fasilitasRuangan.delete({
      where: { id }
    })

    return NextResponse.json({
      message: 'Fasilitas item aset berhasil dihapus'
    })
  } catch (error) {
    console.error('Delete fasilitas aset-item error:', error)

    return NextResponse.json({ message: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

export const PUT = withAuth<{ id: string }>(handlePut)
export const DELETE = withAuth<{ id: string }>(handleDelete)
