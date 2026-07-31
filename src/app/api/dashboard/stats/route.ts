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

    const companyId = user.companyId

    // Total semua aset
    const totalAset = await prisma.aset.count({
      where: { companyId: user.companyId }
    })

    // Total semua item aset (ruangan)
    const totalItemAset = await prisma.ruangan.count({
      where: { companyId: user.companyId }
    })

    const today = new Date()
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59)
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59)

    /**
     * Tagihan yang lunas dalam sebuah rentang waktu.
     *
     * Patokannya tanggal pembayaran. Tagihan lama yang dilunasi sebelum kolom
     * `tanggalBayar` ada nilainya masih kosong, jadi dijatuhkan ke `createdAt`.
     */
    const hitungLunas = (gte: Date, lte: Date) =>
      prisma.tagihan.count({
        where: {
          companyId,
          status: 'LUNAS',
          OR: [{ tanggalBayar: { gte, lte } }, { tanggalBayar: null, createdAt: { gte, lte } }]
        }
      })

    // Booking hari ini: tagihan yang lunas hari ini
    const bookingHariIni = await hitungLunas(startOfDay, endOfDay)

    // Booking bulan ini: tagihan yang lunas bulan ini
    const bookingBulanIni = await hitungLunas(startOfMonth, endOfMonth)

    return NextResponse.json({
      data: {
        totalAset,
        totalItemAset,
        bookingHariIni,
        bookingBulanIni
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
