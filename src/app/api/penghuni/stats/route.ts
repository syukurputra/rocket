import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/src/libs/prisma'
import { withAuth, type AuthContext } from '@/src/libs/auth-middleware'

async function handleGet(request: NextRequest, { user }: AuthContext) {
  try {
    const whereClause: any = {
      createdById: user.id
    }

    // Get total penghuni count
    const totalPenghuni = await prisma.penghuni.count({
      where: whereClause
    })

    // Get total non-aktif penghuni count
    // Assuming non-aktif means status is not "huni" or "HUNI"
    const totalNonAktif = await prisma.penghuni.count({
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
        totalPenghuni,
        totalNonAktif
      },
      message: 'Statistics retrieved successfully'
    })
  } catch (error) {
    console.error('Get penghuni stats error:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

export const GET = withAuth(handleGet)
