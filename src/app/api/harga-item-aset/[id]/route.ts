import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import prisma from '@/src/libs/prisma'
import { withAuth, type AuthContext } from '@/src/libs/auth-middleware'

async function handlePut(request: NextRequest, { params }: AuthContext & { params: { id: string } }) {
  try {
    const body = await request.json()
    const { ruanganId, jenisHarga, harga, promoAktif, hargaPromo } = body

    if (promoAktif === true && !(Number(hargaPromo) > 0)) {
      return NextResponse.json({ message: 'Harga promo harus diisi saat promo aktif' }, { status: 400 })
    }

    const data = await prisma.hargaItemAset.update({
      where: { id: params.id },
      data: {
        ruanganId,
        jenisHarga,
        harga,
        promoAktif: promoAktif !== undefined ? promoAktif === true : undefined,
        hargaPromo: hargaPromo !== undefined ? Number(hargaPromo) || 0 : undefined
      },
      include: { ruangan: { select: { id: true, nama: true } } }
    })

    return NextResponse.json({ data, message: 'Harga berhasil diupdate' })
  } catch (error) {
    console.error('Update harga item aset error:', error)

    return NextResponse.json({ message: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

async function handleDelete(_req: NextRequest, { params }: AuthContext & { params: { id: string } }) {
  try {
    await prisma.hargaItemAset.delete({ where: { id: params.id } })

    return NextResponse.json({ message: 'Harga berhasil dihapus' })
  } catch (error) {
    console.error('Delete harga item aset error:', error)

    return NextResponse.json({ message: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

export const PUT = withAuth(handlePut)
export const DELETE = withAuth(handleDelete)
