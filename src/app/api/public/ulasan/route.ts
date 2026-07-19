import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import prisma from '@/src/libs/prisma'

export const dynamic = 'force-dynamic'

// GET /api/public/ulasan?asetId=... — ringkasan rating + daftar ulasan sebuah aset
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const asetId = searchParams.get('asetId')

    if (!asetId) {
      return NextResponse.json({ message: 'asetId wajib diisi' }, { status: 400 })
    }

    const rows = await prisma.$queryRaw<
      { id: string; nama: string; rating: number; komentar: string | null; createdAt: Date; itemAsetNama: string | null }[]
    >`
      SELECT u.id, u.nama, u.rating, u.komentar, u."createdAt", r.nama AS "itemAsetNama"
      FROM "ulasan" u
      LEFT JOIN "item_aset" r ON r.id = u."itemAsetId"
      WHERE u."asetId" = ${asetId}
      ORDER BY u."createdAt" DESC
    `

    const total = rows.length
    const sum = rows.reduce((s, r) => s + Number(r.rating), 0)
    const average = total > 0 ? Number((sum / total).toFixed(1)) : 0

    // Breakdown per bintang (1..5)
    const breakdown: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }

    rows.forEach(r => {
      const star = Math.min(5, Math.max(1, Number(r.rating)))

      breakdown[star] += 1
    })

    return NextResponse.json({
      data: {
        summary: { average, total, breakdown },
        list: rows.map(r => ({
          id: r.id,
          nama: r.nama,
          rating: Number(r.rating),
          komentar: r.komentar,
          itemAsetNama: r.itemAsetNama,
          createdAt: r.createdAt
        }))
      }
    })
  } catch (error) {
    console.error('Get public ulasan error:', error)

    return NextResponse.json({ message: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
