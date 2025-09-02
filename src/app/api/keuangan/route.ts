import { NextRequest, NextResponse } from 'next/server'

import prisma from '@/src/libs/prisma'
import { withAuth, type AuthContext } from '@/src/libs/auth-middleware'

async function handleGetKeuangan(request: NextRequest, { user, payload }: AuthContext) {
  try {
    const url  = new URL(request.url)
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = parseInt(url.searchParams.get('limit') || '10')
    const search = url.searchParams.get('search') || ''

    const skip = (page - 1) * limit

    const whereClause: any = {}

    if (search) {
      whereClause.OR = [
        { keterangan: { contains: search.trim(), mode: 'insensitive'}}
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
        orderBy: { tanggal: 'desc' }
      }),
      prisma.keuangan.count({ where: whereClause })
    ])

    return NextResponse.json({
      data,
      total: total,
      page: page,
      limit: limit,
      message: 'Data retrieved successfully'
    })

  } catch (error) {
    // console.log(error.message)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function handlePostKeuangan(request: NextRequest, { user }: AuthContext) {
  try {
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

export const GET = withAuth(handleGetKeuangan)
export const POST = withAuth(handlePostKeuangan)
