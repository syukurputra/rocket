import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { withAuth, type AuthContext } from '@/src/libs/auth-middleware'

async function handleGet(request: NextRequest, { user }: AuthContext) {
  try {
    if (!user.companyId) {
      return NextResponse.json({ message: 'User tidak terkait dengan perusahaan' }, { status: 400 })
    }

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'weekly' // weekly | monthly | yearly

    const { PrismaClient } = await import('@prisma/client')
    const prisma = new PrismaClient()

    const now = new Date()
    let startDate: Date

    if (period === 'monthly') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1)
    } else if (period === 'yearly') {
      startDate = new Date(now.getFullYear(), 0, 1)
    } else {
      // weekly — 7 hari terakhir
      startDate = new Date(now)
      startDate.setDate(startDate.getDate() - 6)
      startDate.setHours(0, 0, 0, 0)
    }

    const rows = await (prisma as any).pendapatan.findMany({
      where: {
        companyId: user.companyId,
        tanggal: { gte: startDate }
      },
      select: {
        biayaBooking: true,
        biayaLayanan: true,
        saldoCompany: true,
        tanggal: true
      },
      orderBy: { tanggal: 'asc' }
    })

    await prisma.$disconnect()

    const totalBiayaBooking = rows.reduce((sum: number, r: any) => sum + Number(r.biayaBooking), 0)
    const totalBiayaLayanan = rows.reduce((sum: number, r: any) => sum + Number(r.biayaLayanan), 0)
    const totalSaldo = rows.reduce((sum: number, r: any) => sum + Number(r.saldoCompany), 0)

    // Agregat per hari untuk chart (7 hari / 30 hari)
    const dayMap: Record<string, number> = {}

    rows.forEach((r: any) => {
      const key = new Date(r.tanggal).toISOString().slice(0, 10)

      dayMap[key] = (dayMap[key] || 0) + Number(r.saldoCompany)
    })

    const chartData = Object.entries(dayMap).map(([date, saldo]) => ({ date, saldo }))

    return NextResponse.json({
      data: {
        totalBiayaBooking,
        totalBiayaLayanan,
        totalSaldo,
        chartData,
        period
      }
    })
  } catch (error) {
    console.error('Get pendapatan error:', error)

    return NextResponse.json({ message: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

export const GET = withAuth(handleGet)
