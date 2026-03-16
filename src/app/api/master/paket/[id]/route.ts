import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import prisma from '@/src/libs/prisma'
import { withAuth, type AuthContext } from '@/src/libs/auth-middleware'

// GET /api/master/paket/[id] - Get paket by ID
async function handleGet(request: NextRequest, { user, params }: AuthContext & { params: { id: string } }) {
  try {
    const paket = await prisma.masterPaket.findUnique({
      where: { id: params.id }
    })

    if (!paket) {
      return NextResponse.json({ message: 'Paket not found' }, { status: 404 })
    }

    return NextResponse.json({
      data: paket,
      message: 'Data paket berhasil diambil'
    })
  } catch (error) {
    console.error('Get paket error:', error)

    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/master/paket/[id] - Update paket
async function handlePut(request: NextRequest, { user, params }: AuthContext & { params: { id: string } }) {
  try {
    const body = await request.json()
    const { nama, deskripsi, hargaBulanan, hargaTahunan, urutan, status } = body

    if (!nama) {
      return NextResponse.json({ message: 'Nama paket harus diisi' }, { status: 400 })
    }

    const paket = await prisma.masterPaket.update({
      where: { id: params.id },
      data: {
        nama,
        deskripsi: deskripsi || null,
        hargaBulanan,
        hargaTahunan,
        urutan: urutan !== undefined ? Number(urutan) : undefined,
        status: status !== undefined ? Boolean(status) : undefined
      }
    })

    return NextResponse.json({
      data: paket,
      message: 'Paket berhasil diperbarui'
    })
  } catch (error) {
    console.error('Update paket error:', error)

    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/master/paket/[id] - Delete paket
async function handleDelete(request: NextRequest, { user, params }: AuthContext & { params: { id: string } }) {
  try {
    await prisma.masterPaket.delete({
      where: { id: params.id }
    })

    return NextResponse.json({
      message: 'Paket berhasil dihapus'
    })
  } catch (error) {
    console.error('Delete paket error:', error)

    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

export const GET = withAuth(handleGet)
export const PUT = withAuth(handlePut)
export const DELETE = withAuth(handleDelete)
