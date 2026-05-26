import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import prisma from '@/src/libs/prisma'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '12', 10)
    const search = searchParams.get('search') || ''
    const jenis = searchParams.get('jenis') || ''

    const where: any = {
      status: 'publish',
      ...(search && {
        OR: [
          { nama: { contains: search, mode: 'insensitive' as const } },
          { alamat: { contains: search, mode: 'insensitive' as const } },
          { deskripsi: { contains: search, mode: 'insensitive' as const } }
        ]
      }),
      ...(jenis && { jenis: { equals: jenis, mode: 'insensitive' as const } })
    }

    const [data, total, jenisOptions] = await Promise.all([
      prisma.aset.findMany({
        where,
        include: {
          images: true,
          ruangan: {
            select: {
              id: true,
              nama: true,
              status: true
            }
          },
          fasilitasAset: {
            include: {
              icon: true
            }
          }
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.aset.count({ where }),
      prisma.masterJenisAset.findMany({
        where: { status: true },
        select: { nama: true },
        orderBy: { nama: 'asc' }
      })
    ])

    const totalPages = Math.ceil(total / limit)

    // Sanitize Decimal fields
    const sanitizedData = data.map(item => ({
      ...item,
      nominal: Number(item.nominal),
      ruangan: item.ruangan.map(r => ({ ...r }))
    }))

    return NextResponse.json({
      data: sanitizedData,
      jenisOptions: jenisOptions.map(j => j.nama),
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
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 })
  }
}
