import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import prisma from '@/src/libs/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const now = new Date()

    const rows = await prisma.$queryRaw<any[]>`
      SELECT id, judul, deskripsi, "imageUrl", "periodeAwal", "periodeAkhir", status
      FROM banner_promo
      WHERE status = true
        AND "periodeAwal" <= ${now}
        AND "periodeAkhir" >= ${now}
      ORDER BY "periodeAwal" ASC
    `

    return NextResponse.json({ data: rows })
  } catch (error) {
    console.error('Get public banner promo error:', error)

    return NextResponse.json({ message: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
