import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import prisma from '@/src/libs/prisma'
import { getTarifBiayaLayanan } from '@/src/libs/getBiayaLayanan'
import { hargaEfektif, isPromoBerlaku } from '@/src/libs/hargaPromo'

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

    // Nominalnya bergantung pada total booking yang baru diketahui setelah user
    // memilih jenis harga & durasi, jadi yang dikirim seluruh jenjangnya
    const tarifBiayaLayanan = await getTarifBiayaLayanan()

    return NextResponse.json({
      data: {
        id: ruangan.id,
        nama: ruangan.nama,
        status: ruangan.status,
        companyId: ruangan.companyId,
        asetId: ruangan.asetId,
        asetNama: ruangan.aset?.nama || '',
        tarifBiayaLayanan,

        // `harga` sudah berupa harga yang berlaku (promo kalau aktif) supaya
        // form booking dan perhitungan totalnya otomatis ikut promo.
        hargaItemAset: ruangan.hargaItemAset.map(h => ({
          id: h.id,
          jenisHarga: h.jenisHarga,
          harga: hargaEfektif(h),
          hargaNormal: Number(h.harga),
          promoAktif: isPromoBerlaku(h)
        }))
      },
      message: 'Data berhasil diambil'
    })
  } catch (error) {
    console.error('Get public item-aset error:', error)

    return NextResponse.json({ message: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
