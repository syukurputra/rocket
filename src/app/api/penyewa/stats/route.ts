import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/src/libs/prisma'
import { withAuth, type AuthContext } from '@/src/libs/auth-middleware'

async function handleGet(request: NextRequest, { user }: AuthContext) {
  try {
    const whereClause: any = {
      companyId: user.companyId
    }

    // Get total penyewacount
    const totalPenyewa = await prisma.penyewa.count({
      where: whereClause
    })

    // Get total non-aktif penyewacount
    // Assuming non-aktif means status is not "huni" or "HUNI"
    const totalNonAktif = await prisma.penyewa.count({
      where: {
        ...whereClause,
        status: {
          not: 'huni',
          mode: 'insensitive'
        }
      }
    })

    return NextResponse.json({
      data: {
        totalPenyewa,
        totalNonAktif
      },
      message: 'Statistics retrieved successfully'
    })
  } catch (error) {
    console.error('Get penyewa stats error:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

export const GET = withAuth(handleGet)
