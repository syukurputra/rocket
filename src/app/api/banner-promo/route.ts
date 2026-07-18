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
    const offset = (page - 1) * limit

    const searchPattern = `%${search}%`

    const rows = await prisma.$queryRaw<any[]>`
      SELECT id, judul, deskripsi, "imageUrl", "tampilkanPeriode", "periodeAwal", "periodeAkhir", status, "createdAt", "updatedAt"
      FROM banner_promo
      WHERE (${search} = '' OR judul ILIKE ${searchPattern} OR deskripsi ILIKE ${searchPattern})
      ORDER BY "createdAt" DESC
      LIMIT ${limit} OFFSET ${offset}
    `

    const countRows = await prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*) as count FROM banner_promo
      WHERE (${search} = '' OR judul ILIKE ${searchPattern} OR deskripsi ILIKE ${searchPattern})
    `

    const totalCount = Number(countRows[0]?.count ?? 0)
    const totalPages = Math.ceil(totalCount / limit)

    return NextResponse.json({
      data: rows,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      },
      message: 'Data berhasil diambil'
    })
  } catch (error) {
    console.error('Get banner promo error:', error)

    return NextResponse.json({ message: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

async function handlePost(request: NextRequest, { user }: AuthContext) {
  try {
    const body = await request.json()
    const { judul, deskripsi, tampilkanPeriode = true, periodeAwal, periodeAkhir, status = true } = body

    if (!judul) {
      return NextResponse.json({ message: 'Judul promo harus diisi' }, { status: 400 })
    }

    // Periode wajib hanya jika "Tampilkan Periode" aktif
    if (tampilkanPeriode && (!periodeAwal || !periodeAkhir)) {
      return NextResponse.json({ message: 'Periode promo harus diisi' }, { status: 400 })
    }

    const id = `bp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    const now = new Date()
    const awal = tampilkanPeriode && periodeAwal ? new Date(periodeAwal) : null
    const akhir = tampilkanPeriode && periodeAkhir ? new Date(periodeAkhir) : null

    await prisma.$executeRaw`
      INSERT INTO banner_promo (id, judul, deskripsi, "imageUrl", "tampilkanPeriode", "periodeAwal", "periodeAkhir", status, "createdAt", "updatedAt")
      VALUES (${id}, ${judul}, ${deskripsi || null}, NULL, ${tampilkanPeriode}, ${awal}, ${akhir}, ${status}, ${now}, ${now})
    `

    const rows = await prisma.$queryRaw<any[]>`
      SELECT * FROM banner_promo WHERE id = ${id}
    `

    return NextResponse.json({ data: rows[0], message: 'Banner promo berhasil dibuat' }, { status: 201 })
  } catch (error) {
    console.error('Create banner promo error:', error)

    return NextResponse.json({ message: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

export const GET = withAuth(handleGet)
export const POST = withAuth(handlePost)
