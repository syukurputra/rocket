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
      prisma.tagihan.findMany({
        where: whereClause,
        include: {
          penghuni: {
            select: {
              id: true,
              nama: true
            }
          },
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
      prisma.tagihan.count({ where: whereClause })
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
    console.error('Get tagihan error:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

async function handlePost(request: NextRequest, { user }: AuthContext) {
  try {
    const body = await request.json()
    const { keterangan, mulaiSewa, selesaiSewa, penghuniId } = body

    if (!keterangan || !mulaiSewa || !selesaiSewa || !penghuniId) {
      return NextResponse.json({ message: 'keterangn, mulai sewa dan selesai sewa harus diisi' }, { status: 400 })
    }

    let mulaiSewaDate = new Date()
    if (mulaiSewa) {
      mulaiSewaDate = new Date(mulaiSewa)
      if (isNaN(mulaiSewaDate.getTime())) {
        return NextResponse.json({ message: 'Format tanggal mulai sewa tidak valid' }, { status: 400 })
      }
    }

    let selesaiSewaDate = new Date()
    if (selesaiSewa) {
      selesaiSewaDate = new Date(selesaiSewa)
      if (isNaN(selesaiSewaDate.getTime())) {
        return NextResponse.json({ message: 'Format tanggal mulai sewa tidak valid' }, { status: 400 })
      }
    }

    // Validate that user has a companyId
    if (!user.companyId) {
      return NextResponse.json({ message: 'User tidak memiliki company yang valid' }, { status: 400 })
    }

    const newTagihan = await prisma.tagihan.create({
      data: {
        keterangan: keterangan,
        mulaiSewa: mulaiSewaDate,
        selesaiSewa: selesaiSewaDate,
        penghuniId: penghuniId,
        createdById: user.id,
        updatedById: user.id,
        companyId: user.companyId
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
        data: newTagihan,
        message: 'Tagihan berhasil ditambahkan'
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Buat tagihan error:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

export const GET = withAuth(handleGet)
export const POST = withAuth(handlePost)
