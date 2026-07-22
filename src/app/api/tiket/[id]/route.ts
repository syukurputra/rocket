import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import prisma from '@/src/libs/prisma'
import { withAuth, type AuthContext } from '@/src/libs/auth-middleware'
import { isCustomerService } from '@/src/libs/isCustomerService'

export const runtime = 'nodejs'

type ParamCtx = AuthContext & { params: { id: string } }

// GET /api/tiket/[id] — detail tiket
async function handleGet(_request: NextRequest, { user, params }: ParamCtx) {
  try {
    const { id } = params

    const rows = await prisma.$queryRaw<any[]>`
      SELECT t.id, t."nomorTiket", t."userId", t.deskripsi, t.status, t."createdAt", t."closedAt",
             k.nama AS "kategoriNama",
             u.name AS "userNama", u.username AS "userUsername", u.email AS "userEmail"
      FROM "tiket" t
      LEFT JOIN "kategori_tiket" k ON k.id = t."kategoriTiketId"
      LEFT JOIN "user" u ON u.id = t."userId"
      WHERE t.id = ${id}
    `

    const tiket = rows[0]

    if (!tiket) {
      return NextResponse.json({ message: 'Tiket tidak ditemukan' }, { status: 404 })
    }

    const cs = await isCustomerService(user.companyId)

    if (!cs && tiket.userId !== user.id) {
      return NextResponse.json({ message: 'Tidak diizinkan' }, { status: 403 })
    }

    return NextResponse.json({ data: tiket, isCustomerService: cs, message: 'Data berhasil diambil' })
  } catch (error) {
    console.error('Get tiket detail error:', error)

    return NextResponse.json({ message: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

// PUT /api/tiket/[id]  { status: 'CLOSED' | 'DIPROSES' | 'OPEN' } — tutup / ubah status tiket
async function handlePut(request: NextRequest, { user, params }: ParamCtx) {
  try {
    const { id } = params
    const { status } = await request.json()

    const allowed = ['OPEN', 'HOLD', 'IN PROGRESS', 'DONE', 'DIPROSES', 'CLOSED']

    if (!status || !allowed.includes(status)) {
      return NextResponse.json({ message: 'Status tidak valid' }, { status: 400 })
    }

    const rows = await prisma.$queryRaw<{ userId: string }[]>`SELECT "userId" FROM "tiket" WHERE id = ${id}`

    if (rows.length === 0) {
      return NextResponse.json({ message: 'Tiket tidak ditemukan' }, { status: 404 })
    }

    const cs = await isCustomerService(user.companyId)

    // Hanya CS yang boleh ubah workflow status; user hanya boleh menutup tiketnya sendiri
    if (!cs && (rows[0].userId !== user.id || status !== 'CLOSED')) {
      return NextResponse.json({ message: 'Tidak diizinkan' }, { status: 403 })
    }

    if (status === 'CLOSED') {
      await prisma.$executeRaw`UPDATE "tiket" SET status = 'CLOSED', "closedAt" = NOW(), "updatedAt" = NOW() WHERE id = ${id}`
    } else {
      await prisma.$executeRaw`UPDATE "tiket" SET status = ${status}, "closedAt" = NULL, "updatedAt" = NOW() WHERE id = ${id}`
    }

    return NextResponse.json({ message: status === 'CLOSED' ? 'Tiket ditutup' : 'Status tiket diperbarui' })
  } catch (error) {
    console.error('Update tiket error:', error)

    return NextResponse.json({ message: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

export const GET = withAuth<{ id: string }>(handleGet)
export const PUT = withAuth<{ id: string }>(handlePut)
