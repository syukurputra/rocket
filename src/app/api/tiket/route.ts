import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'

import prisma from '@/src/libs/prisma'
import { withAuth, type AuthContext } from '@/src/libs/auth-middleware'
import { isCustomerService } from '@/src/libs/isCustomerService'

export const runtime = 'nodejs'

async function generateNomorTiket(): Promise<string> {
  const now = new Date()
  const prefix = `TKT-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}-`

  const rows = await prisma.$queryRawUnsafe<{ nomorTiket: string }[]>(
    `SELECT "nomorTiket" FROM "tiket" WHERE "nomorTiket" LIKE $1 ORDER BY "nomorTiket" DESC LIMIT 1`,
    `${prefix}%`
  )

  const last = rows.length > 0 ? parseInt(rows[0].nomorTiket.slice(-5)) : 0

  return `${prefix}${String(last + 1).padStart(5, '0')}`
}

// GET /api/tiket — CS melihat semua tiket, user hanya miliknya
async function handleGet(request: NextRequest, { user }: AuthContext) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || ''
    const cs = await isCustomerService(user.companyId)

    const rows = await prisma.$queryRawUnsafe<any[]>(
      `
      SELECT t.id, t."nomorTiket", t.deskripsi, t.status, t."createdAt", t."closedAt",
             k.nama AS "kategoriNama",
             u.name AS "userNama", u.username AS "userUsername", u.email AS "userEmail",
             (SELECT COUNT(*)::int FROM "tiket_pesan" p WHERE p."tiketId" = t.id) AS "jumlahPesan"
      FROM "tiket" t
      LEFT JOIN "kategori_tiket" k ON k.id = t."kategoriTiketId"
      LEFT JOIN "user" u ON u.id = t."userId"
      WHERE ($1 = '' OR t.status = $1)
        AND ($2 = '' OR t."userId" = $2)
      ORDER BY t."createdAt" DESC
      `,
      status,
      cs ? '' : user.id
    )

    return NextResponse.json({ data: rows, isCustomerService: cs, message: 'Data berhasil diambil' })
  } catch (error) {
    console.error('Get tiket error:', error)

    return NextResponse.json({ message: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

// POST /api/tiket  { kategoriTiketId, deskripsi }
async function handlePost(request: NextRequest, { user }: AuthContext) {
  try {
    const { kategoriTiketId, deskripsi } = await request.json()

    if (!kategoriTiketId || !deskripsi || !String(deskripsi).trim()) {
      return NextResponse.json({ message: 'Kategori dan deskripsi kendala wajib diisi' }, { status: 400 })
    }

    const kategori = await prisma.$queryRaw<{ id: string }[]>`
      SELECT id FROM "kategori_tiket" WHERE id = ${kategoriTiketId}
    `

    if (kategori.length === 0) {
      return NextResponse.json({ message: 'Kategori tiket tidak ditemukan' }, { status: 404 })
    }

    const id = randomUUID()
    const nomorTiket = await generateNomorTiket()

    await prisma.$executeRaw`
      INSERT INTO "tiket" (id, "nomorTiket", "userId", "companyId", "kategoriTiketId", deskripsi, status, "createdAt", "updatedAt")
      VALUES (${id}, ${nomorTiket}, ${user.id}, ${user.companyId}, ${kategoriTiketId}, ${String(deskripsi).trim()}, 'OPEN', NOW(), NOW())
    `

    // Pesan pertama = deskripsi kendala dari user
    await prisma.$executeRaw`
      INSERT INTO "tiket_pesan" (id, "tiketId", "senderId", "senderType", pesan, "createdAt")
      VALUES (${randomUUID()}, ${id}, ${user.id}, 'USER', ${String(deskripsi).trim()}, NOW())
    `

    return NextResponse.json({ data: { id, nomorTiket }, message: 'Tiket berhasil dibuat' }, { status: 201 })
  } catch (error) {
    console.error('Create tiket error:', error)

    return NextResponse.json({ message: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

export const GET = withAuth(handleGet)
export const POST = withAuth(handlePost)
