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

    // Total semua aset
    const totalAset = await prisma.aset.count({
      where: { companyId: user.companyId }
    })

    // Total semua item aset (ruangan)
    const totalItemAset = await prisma.ruangan.count({
      where: { companyId: user.companyId }
    })

    // Tersewa hari ini: tagihan LUNAS yang periodenya mencakup hari ini
    const today = new Date()
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59)

    const tersewaHariIni = await prisma.tagihan.count({
      where: {
        companyId: user.companyId,
        status: 'LUNAS',
        mulaiSewa: { lte: endOfDay },
        selesaiSewa: { gte: startOfDay }
      }
    })

    // Tersewa bulan ini: tagihan LUNAS yang periodenya overlap dengan bulan ini
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59)

    const tersewaBulanIni = await prisma.tagihan.count({
      where: {
        companyId: user.companyId,
        status: 'LUNAS',
        mulaiSewa: { lte: endOfMonth },
        selesaiSewa: { gte: startOfMonth }
      }
    })

    // Booking aset bulan ini: tagihan LUNAS yang dibuat bulan ini
    const bookingAsetBulanIni = await prisma.tagihan.count({
      where: {
        companyId: user.companyId,
        status: 'LUNAS',
        createdAt: { gte: startOfMonth, lte: endOfMonth }
      }
    })

    // Booking aset tahun ini: tagihan LUNAS yang dibuat tahun ini
    const startOfYear = new Date(today.getFullYear(), 0, 1)
    const endOfYear = new Date(today.getFullYear(), 11, 31, 23, 59, 59)

    const bookingAsetTahunIni = await prisma.tagihan.count({
      where: {
        companyId: user.companyId,
        status: 'LUNAS',
        createdAt: { gte: startOfYear, lte: endOfYear }
      }
    })

    return NextResponse.json({
      data: {
        totalAset,
        totalItemAset,
        tersewaHariIni,
        tersewaBulanIni,
        bookingAsetBulanIni,
        bookingAsetTahunIni
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
