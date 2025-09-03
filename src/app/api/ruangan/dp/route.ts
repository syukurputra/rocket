import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/src/libs/prisma'
import { withAuth, type AuthContext } from '@/src/libs/auth-middleware'

async function handleGet(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const asetId = url.searchParams.get('asetId') || ''

    const where: any = {}

    if (asetId) {
      where.asetId = asetId
    }

    const [data] = await Promise.all([
      prisma.ruangan.findMany({
        where,
        select: {
          id: true,
          nama: true,
          asetId: true
        },
        orderBy: { nama: 'desc' }
      }),
    ])

    return NextResponse.json({
      data,
      message: 'Data retrieved successfully'
    })

  } catch (error) {
    console.error('Get ruangan error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export const GET = withAuth(handleGet)
