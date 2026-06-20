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

    // Tampilkan tagihan milik user ini sebagai penyewa (penyewaId = userId)
    const whereClause: any = {
      penyewaId: user.id
    }

    if (search) {
      whereClause.OR = [
        { keterangan: { contains: search.trim(), mode: 'insensitive' } },
        { aset: { nama: { contains: search.trim(), mode: 'insensitive' } } },
        { ruangan: { nama: { contains: search.trim(), mode: 'insensitive' } } }
      ]
    }

    const [data, total] = await Promise.all([
      prisma.tagihan.findMany({
        where: whereClause,
        include: {
          penyewa: {
            select: {
              id: true,
              nama: true,
              nomorTelepon: true,
              email: true,
              status: true
            }
          },
          aset: { select: { id: true, nama: true } },
          ruangan: { select: { id: true, nama: true } }
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
      pagination: { page, limit, totalCount: total, totalPages, hasNext: page < totalPages, hasPrev: page > 1 },
      message: 'Data berhasil diambil'
    })
  } catch (error) {
    console.error('Get booking error:', error)

    return NextResponse.json({ message: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

export const GET = withAuth(handleGet)
