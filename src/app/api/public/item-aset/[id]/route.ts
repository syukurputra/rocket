import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import prisma from '@/src/libs/prisma'
import { getParameter } from '@/src/libs/getParameter'

// GET /api/public/item-aset/[id] — detail item aset (ruangan) untuk halaman checkout booking
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const ruangan = await prisma.ruangan.findUnique({
      where: { id },
      include: {
        aset: { select: { id: true, nama: true, status: true } },
        hargaItemAset: { orderBy: { harga: 'asc' } }
      }
    })

    if (!ruangan) {
      return NextResponse.json({ message: 'Item aset tidak ditemukan' }, { status: 404 })
    }

    const adminBookingValue = await getParameter('ADMIN_BOOKING')
    const adminBooking = Number(adminBookingValue) || 0

    return NextResponse.json({
      data: {
        id: ruangan.id,
        nama: ruangan.nama,
        status: ruangan.status,
        companyId: ruangan.companyId,
        asetId: ruangan.asetId,
        asetNama: ruangan.aset?.nama || '',
        adminBooking,
        hargaItemAset: ruangan.hargaItemAset.map(h => ({
          id: h.id,
          jenisHarga: h.jenisHarga,
          harga: Number(h.harga)
        }))
      },
      message: 'Data berhasil diambil'
    })
  } catch (error) {
    console.error('Get public item-aset error:', error)

    return NextResponse.json({ message: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
