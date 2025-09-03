import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/src/libs/prisma'
import { withAuth, type AuthContext } from '@/src/libs/auth-middleware'

async function handleGet(
  request: NextRequest,
  { user }: AuthContext
) {
  try {
    const { searchParams } = new URL(request.url)
    const jenisFilter = searchParams.get('jenis')
    const where: any = {}

    if (jenisFilter && (jenisFilter === 'pemasukan' || jenisFilter === 'pengeluaran')) {
      where.jenis = jenisFilter
    }

    const [data] = await Promise.all([
      prisma.masterIcon.findMany({
        where,
        select: {
          id: true,
          nama: true,
          code: true,
          jenis: true,
          color: true
        },
        orderBy: { nama: 'desc' }
      }),
    ])

    return NextResponse.json({
      data,
      message: 'Data retrieved successfully'
    })

  } catch (error) {
    console.error('Get keuangan error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export const GET = withAuth(handleGet)
