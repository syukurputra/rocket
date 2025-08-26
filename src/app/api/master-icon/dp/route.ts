import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/src/libs/prisma'
import { extractTokenFromRequest, verifyAccessToken } from '@/src/libs/jwt'

export async function GET(request: NextRequest) {
  try {
    // Verify JWT token
    const token = extractTokenFromRequest(request)

    if (!token) {
      return NextResponse.json(
        { message: 'Access token required' },
        { status: 401 }
      )
    }

    const payload = verifyAccessToken(token)

    if (!payload) {
      return NextResponse.json(
        { message: 'Invalid or expired token' },
        { status: 401 }
      )
    }

    // const userId = payload.userId
    //
    // const currentUser = await prisma.user.findUnique({
    //   where: { id: payload.userId }
    // })
    //
    // const masteIcon = await prisma.masterIcon.create({
    //   data: {
    //     nama: "Sewa Kantor",
    //     code: "tabler-home",
    //     jenis: "pemasukan",
    //     createdById: currentUser.id,
    //     updatedById: currentUser.id
    //   },
    //   include: {
    //     createdBy: {
    //       select: {
    //         id: true,
    //         username: true
    //       }
    //     },
    //     updatedBy: {
    //       select: {
    //         id: true,
    //         username: true
    //       }
    //     }
    //   }
    // })

    const { searchParams } = new URL(request.url)
    const jenisFilter = searchParams.get('jenis') // Get jenis filter from query params
    const where: any = {}

    if (jenisFilter && (jenisFilter === 'pemasukan' || jenisFilter === 'pengeluaran')) {
      where.jenis = jenisFilter
    }

    // Fetch data dengan relations
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
