import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import prisma from '@/src/libs/prisma'
import { withAuth, type AuthContext } from '@/src/libs/auth-middleware'

// GET /api/booking/transaksi-summary
// Total transaksi = jumlah nominal tagihan milik company ini dengan statusRekon = 'SESUAI'
async function handleGet(_request: NextRequest, { user }: AuthContext) {
  try {
    if (!user.companyId) {
      return NextResponse.json({ data: { totalTransaksi: 0, jumlahTransaksi: 0 } })
    }

    const agg = await prisma.tagihan.aggregate({
      where: { companyId: user.companyId, statusRekon: 'SESUAI' },
      _sum: { nominal: true },
      _count: true
    })

    return NextResponse.json({
      data: {
        totalTransaksi: Number(agg._sum.nominal ?? 0),
        jumlahTransaksi: agg._count
      },
      message: 'Data berhasil diambil'
    })
  } catch (error) {
    console.error('Get transaksi summary error:', error)

    return NextResponse.json({ message: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

export const GET = withAuth(handleGet)
