import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/src/libs/prisma'
import { withAuth, type AuthContext } from '@/src/libs/auth-middleware'

async function handleGet(request: NextRequest, { user }: AuthContext) {
  try {
    const url = new URL(request.url)
    const yearParam = url.searchParams.get('year')
    const monthParam = url.searchParams.get('month')

    const currentYear = new Date().getFullYear()
    const currentMonth = new Date().getMonth() + 1

    const year = yearParam ? parseInt(yearParam) : currentYear
    const month = monthParam ? parseInt(monthParam) : currentMonth

    // Validate parameters
    if (isNaN(year) || year < 2000 || year > 2100) {
      return NextResponse.json({ message: 'Invalid year parameter' }, { status: 400 })
    }

    if (isNaN(month) || month < 1 || month > 12) {
      return NextResponse.json({ message: 'Invalid month parameter' }, { status: 400 })
    }

    // Validate user has company
    if (!user.companyId) {
      return NextResponse.json({ message: 'User tidak memiliki company yang valid' }, { status: 400 })
    }

    // Get start and end of month
    const startOfMonth = new Date(year, month - 1, 1)
    const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999)

    // Fetch all transactions for the month grouped by category
    const transactions = await prisma.keuangan.findMany({
      where: {
        companyId: user.companyId,
        tanggal: {
          gte: startOfMonth,
          lte: endOfMonth
        }
      },
      include: {
        categoryKeuangan: {
          include: {
            icon: true
          }
        }
      }
    })

    // Group by category and calculate totals
    const categoryMap = new Map<
      string,
      {
        id: string
        nama: string
        icon: { code: string } | null
        color: string | null
        jenis: string
        total: number
      }
    >()

    let totalPemasukan = 0
    let totalPengeluaran = 0

    transactions.forEach(transaction => {
      const categoryId = transaction.categoryKeuanganId
      const nominal = Number(transaction.nominal)
      const jenis = transaction.jenis.toLowerCase()

      if (jenis === 'pemasukan') {
        totalPemasukan += nominal
      } else if (jenis === 'pengeluaran') {
        totalPengeluaran += nominal
      }

      if (categoryId && transaction.categoryKeuangan) {
        if (!categoryMap.has(categoryId)) {
          categoryMap.set(categoryId, {
            id: categoryId,
            nama: transaction.categoryKeuangan.nama,
            icon: transaction.categoryKeuangan.icon ? { code: transaction.categoryKeuangan.icon.code } : null,
            color: transaction.categoryKeuangan.color,
            jenis: transaction.categoryKeuangan.jenis,
            total: 0
          })
        }

        const category = categoryMap.get(categoryId)!
        category.total += nominal
      }
    })

    // Calculate percentages and convert to array
    const grandTotal = totalPemasukan + totalPengeluaran

    const categories = Array.from(categoryMap.values()).map(category => ({
      ...category,
      // Percentage = (category total / monthly total) * 100
      percentage: grandTotal > 0 ? Math.round((category.total / grandTotal) * 100) : 0
    }))

    // Sort by total descending
    categories.sort((a, b) => b.total - a.total)

    return NextResponse.json({
      data: {
        year,
        month,
        categories,
        totalPemasukan,
        totalPengeluaran,
        grandTotal
      },
      message: 'Category report retrieved successfully'
    })
  } catch (error) {
    console.error('Get category report error:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

export const GET = withAuth(handleGet)
