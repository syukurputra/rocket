import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import prisma from '@/src/libs/prisma'
import { withAuth, type AuthContext } from '@/src/libs/auth-middleware'

async function handleGet(request: NextRequest, { user }: AuthContext) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const asetId = searchParams.get('asetId')

    const whereClause: any = {}

    if (search) {
      whereClause.OR = [{ nama: { contains: search.trim(), mode: 'insensitive' } }]
    }

    if (asetId) {
      whereClause.asetId = asetId
    }

    whereClause.createdById = user.id

    const [data, total] = await Promise.all([
      prisma.ruangan.findMany({
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
          images: true
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.ruangan.count({ where: whereClause })
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
    console.error('Get aset-item error:', error)

    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

async function handlePost(request: NextRequest, { user }: AuthContext) {
  try {
    const body = await request.json()
    const { nama, deskripsi, status, asetId } = body

    if (!nama || !status || !asetId) {
      return NextResponse.json({ message: 'Nama, status, dan aset harus diisi' }, { status: 400 })
    }

    // Validate that user has a companyId
    if (!user.companyId) {
      return NextResponse.json({ message: 'User tidak memiliki company yang valid' }, { status: 400 })
    }

    const newRuangan = await prisma.ruangan.create({
      data: {
        asetId: asetId,
        nama: nama,
        deskripsi: deskripsi || '',
        status: status,
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
        },
        images: true
      }
    })

    return NextResponse.json(
      {
        data: newRuangan,
        message: 'Item aset berhasil ditambahkan'
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Buat aset-item error:', error)

    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

export const GET = withAuth(handleGet)
export const POST = withAuth(handlePost)
