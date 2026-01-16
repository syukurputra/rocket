import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import prisma from '@/src/libs/prisma'
import { withAuth, type AuthContext } from '@/src/libs/auth-middleware'

async function handleGet(request: NextRequest, { user }: AuthContext) {
  try {
    const url = new URL(request.url)
    const yearParam = url.searchParams.get('year')
    const currentYear = new Date().getFullYear()
    const year = yearParam ? parseInt(yearParam) : currentYear

    // Validate year
    if (isNaN(year) || year < 2000 || year > 2100) {
      return NextResponse.json({ message: 'Invalid year parameter' }, { status: 400 })
    }

    // Validate user has company
    if (!user.companyId) {
      return NextResponse.json({ message: 'User tidak memiliki company yang valid' }, { status: 400 })
    }

    // Get all transactions for the specified year filtered by company
    const startOfYear = new Date(year, 0, 1)
    const endOfYear = new Date(year, 11, 31, 23, 59, 59, 999)

    const transactions = await prisma.keuangan.findMany({
      where: {
        companyId: user.companyId!, // Filter by company instead of user
        tanggal: {
          gte: startOfYear,
          lte: endOfYear
        }
      },
      select: {
        jenis: true,
        nominal: true,
        tanggal: true
      },
      orderBy: {
        tanggal: 'asc'
      }
    })

    // Initialize monthly data structure
    const monthlyData = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      monthName: new Date(year, i, 1).toLocaleString('id-ID', { month: 'short' }),
      pemasukan: 0,
      pengeluaran: 0,
      total: 0
    }))

    // Aggregate data by month
    transactions.forEach(transaction => {
      const month = new Date(transaction.tanggal).getMonth()
      const nominal = Number(transaction.nominal)

      if (transaction.jenis.toLowerCase() === 'pemasukan') {
        monthlyData[month].pemasukan += nominal
      } else if (transaction.jenis.toLowerCase() === 'pengeluaran') {
        monthlyData[month].pengeluaran += nominal
      }
    })

    // Calculate totals
    monthlyData.forEach(data => {
      data.total = data.pemasukan - data.pengeluaran
    })

    // Calculate yearly summary
    const yearlyPemasukan = monthlyData.reduce((sum, data) => sum + data.pemasukan, 0)
    const yearlyPengeluaran = monthlyData.reduce((sum, data) => sum + data.pengeluaran, 0)
    const yearlyTotal = yearlyPemasukan - yearlyPengeluaran

    return NextResponse.json({
      data: {
        year,
        monthlyData,
        summary: {
          totalPemasukan: yearlyPemasukan,
          totalPengeluaran: yearlyPengeluaran,
          total: yearlyTotal
        }
      },
      message: 'Report retrieved successfully'
    })
  } catch (error) {
    console.error('Get keuangan report error:', error)

    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

export const GET = withAuth(handleGet)
