import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import prisma from '@/src/libs/prisma'
import { withAuth } from '@/src/libs/auth-middleware'

async function handleGet(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const asetId = url.searchParams.get('asetId') || ''

    const where: any = {}

    if (asetId) {
      where.asetId = asetId
    }

    const [data] = await Promise.all([
      prisma.ruangan.findMany({
        where,
        select: {
          id: true,
          nama: true,
          asetId: true,
          hargaItemAset: { select: { id: true, jenisHarga: true, harga: true } }
        },
        orderBy: { nama: 'desc' }
      }),
    ])

    return NextResponse.json({
      data,
      message: 'Data berhasil diambil'
    })
  } catch (error) {
    console.error('Get aset-item error:', error)

    return NextResponse.json(
      { message: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

export const GET = withAuth(handleGet)
