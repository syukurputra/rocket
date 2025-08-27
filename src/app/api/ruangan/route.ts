import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/src/libs/prisma'
import { extractTokenFromRequest, verifyAccessToken } from '@/src/libs/jwt'

export async function GET(request: NextRequest) {
  try {
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

    const userId = payload.userId

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status')

    // Build where condition
    const where = {
      createdById: userId,
      ...(search && {
        OR: [
          { nama: { contains: search, mode: 'insensitive' as const } },
        ]
      }),
      ...(status !== null && status !== '' && { status: status === 'true' })
    }

    const [data, total] = await Promise.all([
      prisma.ruangan.findMany({
        where,
        include: {
          createdBy: {
            select: {
              id: true,
              username: true
            }
          },
          updatedBy: {
            select: {
              id: true,
              username: true
            }
          }
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.ruangan.count({ where })
    ])

    return NextResponse.json({
      data,
      total: total,
      page: page,
      limit: limit,
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

export async function POST(request: NextRequest) {
  try {
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

    const currentUser = await prisma.user.findUnique({
      where: { id: payload.userId }
    })

    if (!currentUser) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const { nama, status, nominal, asetId } = body

    // Validation
    if (!nama || !status || !nominal || !asetId) {
      return NextResponse.json(
        { message: 'Jenis, status, dan nominal harus diisi' },
        { status: 400 }
      )
    }

    const newRuangan = await prisma.ruangan.create({
      data: {
        asetId: asetId,
        nama: nama,
        status: status !== undefined ? Boolean(status) : true,
        nominal: nominal,
        createdById: currentUser.id,
        updatedById: currentUser.id
      },
      include: {
        createdBy: {
          select: {
            id: true,
            username: true
          }
        },
        updatedBy: {
          select: {
            id: true,
            username: true
          }
        }
      }
    })

    return NextResponse.json({
      data: newRuangan,
      message: 'Ruangan berhasil ditambahkan'
    }, { status: 201 })

  } catch (error) {
    console.error('Buat ruangan error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
