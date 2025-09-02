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

    const where = {
      createdById: userId,
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: payload.userId }
    })

    const [data, total] = await Promise.all([
      prisma.penghuni.findMany({
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
          ruangan: {
            select: {
              id: true,
              nama: true
            }
          }
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.penghuni.count({ where })
    ])

    return NextResponse.json({
      data,
      total: total,
      page: page,
      limit: limit,
      message: 'Data retrieved successfully'
    })

  } catch (error) {
    console.error('Get penghuni error:', error)
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
    const { nama, status, mulaiHuni, selesaiHuni, asetId, ruanganId } = body

    if (!nama || !status || !mulaiHuni || !selesaiHuni || !asetId || !ruanganId) {
      return NextResponse.json(
        { message: 'nama, status, mulai huni, aset dan ruangan harus diisi' },
        { status: 400 }
      )
    }

    let mulaiHuniDate = new Date()
    if (mulaiHuni) {
      mulaiHuniDate = new Date(mulaiHuni)
      if (isNaN(mulaiHuniDate.getTime())) {
        return NextResponse.json(
          { message: 'Format tanggal mulai huni tidak valid' },
          { status: 400 }
        )
      }
    }

    let selesaiHuniDate = new Date()
    if (selesaiHuni) {
      selesaiHuniDate = new Date(selesaiHuni)
      if (isNaN(selesaiHuniDate.getTime())) {
        return NextResponse.json(
          { message: 'Format tanggal mulai huni tidak valid' },
          { status: 400 }
        )
      }
    }

    const newPenghuni = await prisma.penghuni.create({
      data: {
        nama: nama,
        status: status,
        mulaiHuni: mulaiHuniDate,
        selesaiHuni: selesaiHuniDate,
        asetId: asetId,
        ruanganId: ruanganId,
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
      data: newPenghuni,
      message: 'Penghuni berhasil ditambahkan'
    }, { status: 201 })

  } catch (error) {
    console.error('Buat penghuni error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
