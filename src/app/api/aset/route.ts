import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { extractTokenFromRequest, verifyAccessToken } from '@/lib/jwt'

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

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status')

    // Build where condition
    const where = {
      ...(search && {
        OR: [
          { nama: { contains: search, mode: 'insensitive' as const } },
          { alamat: { contains: search, mode: 'insensitive' as const } }
        ]
      }),
      ...(status !== null && status !== '' && { status: status === 'true' })
    }

    // Fetch data dengan relations
    const [data, total] = await Promise.all([
      prisma.aset.findMany({
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
      prisma.aset.count({ where })
    ])

    return NextResponse.json({
      data,
      total: total,
      page: page,
      limit: limit,
      message: 'Data retrieved successfully'
    })

  } catch (error) {
    console.error('Get aset error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
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

    // Get current user
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
    const { jenis, nama, alamat, kota, provinsi, status } = body

    // Validation
    if (!jenis || !nama || !alamat || !kota || !provinsi) {
      return NextResponse.json(
        { message: 'Jenis, nama, alamat, kota, dan provinsi harus diisi' },
        { status: 400 }
      )
    }

    // Create new aset dengan user relations
    const newAset = await prisma.aset.create({
      data: {
        jenis,
        nama,
        alamat,
        kota,
        provinsi,
        status: status !== undefined ? Boolean(status) : true,
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
      data: newAset,
      message: 'Aset berhasil ditambahkan'
    }, { status: 201 })

  } catch (error) {
    console.error('Create aset error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
