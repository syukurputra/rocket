import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import prisma from '@/src/libs/prisma'
import { withAuth, type AuthContext } from '@/src/libs/auth-middleware'

// GET /api/dashboard/stats - Get dashboard statistics
async function handleGet(request: NextRequest, { user }: AuthContext) {
  try {
    if (!user.companyId) {
      return NextResponse.json({ message: 'User tidak terkait dengan perusahaan' }, { status: 400 })
    }

    // Get total active aset
    const totalAsetAktif = await prisma.aset.count({
      where: {
        companyId: user.companyId,
        status: 'aktif'
      }
    })

    // Get total ruangan huni (status = "huni")
    const totalRuanganHuni = await prisma.ruangan.count({
      where: {
        companyId: user.companyId,
        status: 'huni'
      }
    })

    // Get total ruangan tidak huni (status = "tidak huni")
    const totalRuanganTidakHuni = await prisma.ruangan.count({
      where: {
        companyId: user.companyId,
        status: 'tidak huni'
      }
    })

    // Get penyewa yang selesai huni dalam 1 bulan ke depan
    const oneMonthFromNow = new Date()

    oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1)

    const penyewaSelesaiHuni = await prisma.penyewa.count({
      where: {
        companyId: user.companyId,
        selesaiSewa: {
          gte: new Date(), // dari hari ini
          lte: oneMonthFromNow // sampai 1 bulan ke depan
        }
      }
    })

    return NextResponse.json({
      data: {
        totalAsetAktif,
        totalRuanganHuni,
        totalRuanganTidakHuni,
        penyewaSelesaiHuni
      },
      message: 'Statistik berhasil diambil'
    })
  } catch (error) {
    console.error('Get statistics error:', error)

    return NextResponse.json(
      {
        message: 'Terjadi kesalahan server',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export const GET = withAuth(handleGet)
