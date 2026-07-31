import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import prisma from '@/src/libs/prisma'
import { withAuth, type AuthContext } from '@/src/libs/auth-middleware'

// GET /api/booking/transaksi-summary
// Total transaksi = jumlah nominal tagihan pada item aset milik company login dengan status LUNAS
async function handleGet(_request: NextRequest, { user }: AuthContext) {
  try {
    if (!user.companyId) {
      return NextResponse.json({
        data: { totalTransaksi: 0, jumlahTransaksi: 0, tahun: new Date().getFullYear(), bulanan: Array(12).fill(0) }
      })
    }

    const agg = await prisma.tagihan.aggregate({
      where: { status: 'LUNAS', ruangan: { companyId: user.companyId } },
      _sum: { nominal: true },
      _count: true
    })

    // Jumlah transaksi per bulan sepanjang tahun berjalan. Patokannya tanggal
    // pelunasan; tagihan lama yang `tanggalBayar`-nya kosong pakai createdAt.
    const tahun = new Date().getFullYear()

    const rows = await prisma.$queryRaw<{ bulan: number; jumlah: number }[]>`
      SELECT EXTRACT(MONTH FROM COALESCE(t."tanggalBayar", t."createdAt"))::int AS bulan,
             COUNT(*)::int AS jumlah
      FROM "tagihan" t
      JOIN "item_aset" r ON r.id = t."itemAsetId"
      WHERE t.status = 'LUNAS'
        AND r."companyId" = ${user.companyId}
        AND EXTRACT(YEAR FROM COALESCE(t."tanggalBayar", t."createdAt")) = ${tahun}
      GROUP BY 1
    `

    const bulanan = Array(12).fill(0)

    rows.forEach(r => {
      bulanan[Number(r.bulan) - 1] = Number(r.jumlah)
    })

    return NextResponse.json({
      data: {
        totalTransaksi: Number(agg._sum.nominal ?? 0),
        jumlahTransaksi: agg._count,
        tahun,
        bulanan
      },
      message: 'Data berhasil diambil'
    })
  } catch (error) {
    console.error('Get transaksi summary error:', error)

    return NextResponse.json({ message: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

export const GET = withAuth(handleGet)
