import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/src/libs/prisma'
import { withAuth, type AuthContext } from '@/src/libs/auth-middleware'

async function handleGet(request: NextRequest, { user }: AuthContext) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''

    const whereClause: any = {}

    if (search) {
      whereClause.OR = [{ nama: { contains: search.trim(), mode: 'insensitive' } }]
    }

    whereClause.createdById = user.id

    const [data, total] = await Promise.all([
      prisma.penghuni.findMany({
        where: whereClause,
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
      prisma.penghuni.count({ where: whereClause })
    ])

    const totalPages = Math.ceil(total / limit)

    return NextResponse.json({
      data,
      pagination: {
        page,
        limit,
        totalCount: total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      },
      message: 'Data retrieved successfully'
    })
  } catch (error) {
    console.error('Get penghuni error:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

async function handlePost(request: NextRequest, { user }: AuthContext) {
  try {
    const body = await request.json()
    const { nama, status, mulaiHuni, selesaiHuni, asetId, ruanganId } = body

    if (!nama || !status || !mulaiHuni || !selesaiHuni || !asetId || !ruanganId) {
      return NextResponse.json({ message: 'nama, status, mulai huni, aset dan ruangan harus diisi' }, { status: 400 })
    }

    let mulaiHuniDate = new Date()
    if (mulaiHuni) {
      mulaiHuniDate = new Date(mulaiHuni)
      if (isNaN(mulaiHuniDate.getTime())) {
        return NextResponse.json({ message: 'Format tanggal mulai huni tidak valid' }, { status: 400 })
      }
    }

    let selesaiHuniDate = new Date()
    if (selesaiHuni) {
      selesaiHuniDate = new Date(selesaiHuni)
      if (isNaN(selesaiHuniDate.getTime())) {
        return NextResponse.json({ message: 'Format tanggal mulai huni tidak valid' }, { status: 400 })
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
        createdById: user.id,
        updatedById: user.id,
        companyId: user.companyId || ''
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

    return NextResponse.json(
      {
        data: newPenghuni,
        message: 'Penghuni berhasil ditambahkan'
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Buat penghuni error:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

export const GET = withAuth(handleGet)
export const POST = withAuth(handlePost)
