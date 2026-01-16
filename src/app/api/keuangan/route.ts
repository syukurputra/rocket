import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import prisma from '@/src/libs/prisma'
import { withAuth, type AuthContext } from '@/src/libs/auth-middleware'

async function handleGet(request: NextRequest, { user }: AuthContext) {
  try {
    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = parseInt(url.searchParams.get('limit') || '10')
    const search = url.searchParams.get('search') || ''

    const whereClause: any = {}

    if (search) {
      whereClause.OR = [
        { keterangan: { contains: search.trim(), mode: 'insensitive' } },
        {
          aset: {
            nama: { contains: search.trim(), mode: 'insensitive' }
          }
        },
        {
          categoryKeuangan: {
            nama: { contains: search.trim(), mode: 'insensitive' }
          }
        }
      ]
    }

    whereClause.createdById = user.id

    const [data, total] = await Promise.all([
      prisma.keuangan.findMany({
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
          categoryKeuangan: {
            select: {
              id: true,
              nama: true,
              deskripsi: true,
              color: true,
              icon: {
                select: {
                  id: true,
                  nama: true,
                  code: true
                }
              }
            }
          }
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { tanggal: 'desc' }
      }),
      prisma.keuangan.count({ where: whereClause })
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
    console.error('Get keuangan error:', error)

    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

async function handlePost(request: NextRequest, { user }: AuthContext) {
  try {
    const body = await request.json()
    const { jenis, keterangan, nominal, asetId, categoryKeuanganId, tanggal } = body

    if (!jenis || !nominal || !asetId || !categoryKeuanganId) {
      return NextResponse.json({ message: 'jenis, nominal, aset, dan kategori keuangan harus diisi' }, { status: 400 })
    }

    let transactionDate = new Date()

    if (tanggal) {
      transactionDate = new Date(tanggal)

      if (isNaN(transactionDate.getTime())) {
        return NextResponse.json({ message: 'Format tanggal tidak valid' }, { status: 400 })
      }
    }

    const aset = await prisma.aset.findUnique({
      where: { id: asetId }
    })

    if (!aset) {
      return NextResponse.json({ message: 'Aset tidak ditemukan' }, { status: 400 })
    }

    const category = await prisma.categoryKeuangan.findUnique({
      where: { id: categoryKeuanganId }
    })

    if (!category) {
      return NextResponse.json({ message: 'Kategori keuangan tidak ditemukan' }, { status: 400 })
    }

    const nominalValue = typeof nominal === 'string' ? parseFloat(nominal) : nominal

    // Validate that user has a companyId
    if (!user.companyId) {
      return NextResponse.json({ message: 'User tidak memiliki company yang valid' }, { status: 400 })
    }

    const newKeuangan = await prisma.keuangan.create({
      data: {
        jenis: jenis,
        keterangan: keterangan || '',
        nominal: nominalValue,
        tanggal: transactionDate,
        asetId: asetId,
        categoryKeuanganId: categoryKeuanganId,
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
        aset: {
          select: {
            id: true,
            nama: true,
            jenis: true
          }
        },
        categoryKeuangan: {
          select: {
            id: true,
            nama: true,
            deskripsi: true,
            color: true,
            icon: {
              select: {
                id: true,
                nama: true,
                code: true
              }
            }
          }
        }
      }
    })

    return NextResponse.json(
      {
        data: newKeuangan,
        message: 'Keuangan berhasil ditambahkan'
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Create keuangan error:', error)

    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

export const GET = withAuth(handleGet)
export const POST = withAuth(handlePost)
