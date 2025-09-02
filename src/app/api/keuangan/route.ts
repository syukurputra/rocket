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
    const jenis = searchParams.get('jenis')

    const where = {
      createdById: userId,
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: payload.userId }
    })

    const [data, total] = await Promise.all([
      prisma.keuangan.findMany({
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
          },
          aset: {
            select: {
              id: true,
              nama: true,
              jenis: true
            }
          },
          icon: {
            select: {
              id: true,
              nama: true,
              code: true,
              color: true
            }
          }
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.keuangan.count({ where })
    ])

    return NextResponse.json({
      data,
      total: total,
      page: page,
      limit: limit,
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
    const { jenis, keterangan, nominal, asetId, iconId, tanggal } = body

    if (!jenis || !nominal || !asetId) {
      return NextResponse.json(
        { message: 'jenis, nominal, aset, tanggal transaksi harus diisi' },
        { status: 400 }
      )
    }

    let transactionDate = new Date()
    if (tanggal) {
      transactionDate = new Date(tanggal)
      if (isNaN(transactionDate.getTime())) {
        return NextResponse.json(
          { message: 'Format tanggal tidak valid' },
          { status: 400 }
        )
      }
    }

    const newKeuangan = await prisma.keuangan.create({
      data: {
        jenis: jenis,
        keterangan: keterangan,
        nominal: nominal,
        tanggal: transactionDate,
        asetId: asetId,
        iconId: iconId,
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
      data: newKeuangan,
      message: 'Keuangan berhasil ditambahkan'
    }, { status: 201 })

  } catch (error) {
    console.error('Buat keuangan error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
