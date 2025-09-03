import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/src/libs/prisma'
import { withAuth, type AuthContext } from '@/src/libs/auth-middleware'

async function handleGet(
  request: NextRequest,
  { user }: AuthContext
) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''

    const whereClause: any = {}

    if (search) {
      whereClause.OR = [
        { nama: { contains: search.trim(), mode: 'insensitive' } },
      ]
    }

    const [data, total] = await Promise.all([
      prisma.masterIcon.findMany({
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
          }
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.aset.count({ where: whereClause })
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
    console.error('Get icon error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function handlePost(
  request: NextRequest,
  { user }: AuthContext
) {
  try {
    const body = await request.json()
    const { nama, jenis, code, color } = body

    if (!nama || !jenis || !code) {
      return NextResponse.json(
        { message: 'Nama, jenis dan code harus diisi' },
        { status: 400 }
      )
    }

    const newIcon = await prisma.masterIcon.create({
      data: {
        nama: nama,
        jenis: jenis,
        code: code,
        color: color,
        createdById: user.id,
        updatedById: user.id
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
      data: newIcon,
      message: 'Icon berhasil ditambahkan'
    }, { status: 201 })

  } catch (error) {
    console.error('Create icon error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export const GET = withAuth(handleGet)
export const POST = withAuth(handlePost)
