import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import prisma from '@/src/libs/prisma'
import { withAuth, type AuthContext } from '@/src/libs/auth-middleware'

async function handlePut(request: NextRequest, { params }: AuthContext & { params: { id: string } }) {
  try {
    const body = await request.json()
    const { ruanganId, jenisHarga, harga } = body

    const data = await prisma.hargaItemAset.update({
      where: { id: params.id },
      data: { ruanganId, jenisHarga, harga },
      include: { ruangan: { select: { id: true, nama: true } } }
    })

    return NextResponse.json({ data, message: 'Harga berhasil diupdate' })
  } catch (error) {
    console.error('Update harga item aset error:', error)

    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

async function handleDelete(_req: NextRequest, { params }: AuthContext & { params: { id: string } }) {
  try {
    await prisma.hargaItemAset.delete({ where: { id: params.id } })

    return NextResponse.json({ message: 'Harga berhasil dihapus' })
  } catch (error) {
    console.error('Delete harga item aset error:', error)

    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

export const PUT = withAuth(handlePut)
export const DELETE = withAuth(handleDelete)
