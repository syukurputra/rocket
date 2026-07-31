import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import prisma from '@/src/libs/prisma'
import { withAuth, type AuthContext } from '@/src/libs/auth-middleware'

// GET /api/harga-item-aset?ruanganId=xxx  OR  ?asetId=xxx
async function handleGet(request: NextRequest, _ctx: AuthContext) {
  try {
    const { searchParams } = new URL(request.url)
    const ruanganId = searchParams.get('ruanganId')
    const asetId = searchParams.get('asetId')

    const data = await prisma.hargaItemAset.findMany({
      where: ruanganId
        ? { ruanganId }
        : asetId
          ? { ruangan: { asetId } }
          : {},
      include: {
        ruangan: { select: { id: true, nama: true } }
      },
      orderBy: [{ ruanganId: 'asc' }, { jenisHarga: 'asc' }]
    })

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Get harga item aset error:', error)

    return NextResponse.json({ message: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

// POST /api/harga-item-aset
async function handlePost(request: NextRequest, _ctx: AuthContext) {
  try {
    const body = await request.json()
    const { ruanganId, jenisHarga, harga, promoAktif, hargaPromo } = body

    if (!ruanganId || !jenisHarga || harga === undefined) {
      return NextResponse.json({ message: 'ruanganId, jenisHarga, dan harga harus diisi' }, { status: 400 })
    }

    if (promoAktif === true && !(Number(hargaPromo) > 0)) {
      return NextResponse.json({ message: 'Harga promo harus diisi saat promo aktif' }, { status: 400 })
    }

    const data = await prisma.hargaItemAset.create({
      data: {
        ruanganId,
        jenisHarga,
        harga,
        promoAktif: promoAktif === true,
        hargaPromo: Number(hargaPromo) || 0
      },
      include: { ruangan: { select: { id: true, nama: true } } }
    })

    return NextResponse.json({ data, message: 'Harga berhasil ditambahkan' }, { status: 201 })
  } catch (error) {
    console.error('Create harga item aset error:', error)

    return NextResponse.json({ message: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

export const GET = withAuth(handleGet)
export const POST = withAuth(handlePost)
