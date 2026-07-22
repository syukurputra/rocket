import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'

import prisma from '@/src/libs/prisma'
import { withAuth, type AuthContext } from '@/src/libs/auth-middleware'
import { isCustomerService } from '@/src/libs/isCustomerService'

export const runtime = 'nodejs'

type ParamCtx = AuthContext & { params: { id: string } }

// Ambil tiket + cek hak akses
async function getTiketAndRole(tiketId: string, user: { id: string; companyId: string | null }) {
  const rows = await prisma.$queryRaw<{ userId: string; status: string }[]>`
    SELECT "userId", status FROM "tiket" WHERE id = ${tiketId}
  `

  if (rows.length === 0) return { tiket: null, cs: false, allowed: false }

  const cs = await isCustomerService(user.companyId)
  const allowed = cs || rows[0].userId === user.id

  return { tiket: rows[0], cs, allowed }
}

// GET /api/tiket/[id]/pesan — daftar percakapan tiket
async function handleGet(_request: NextRequest, { user, params }: ParamCtx) {
  try {
    const { id } = params
    const { tiket, cs, allowed } = await getTiketAndRole(id, user)

    if (!tiket) return NextResponse.json({ message: 'Tiket tidak ditemukan' }, { status: 404 })
    if (!allowed) return NextResponse.json({ message: 'Tidak diizinkan' }, { status: 403 })

    const rows = await prisma.$queryRaw<any[]>`
      SELECT p.id, p."senderType", p."senderId", p.pesan, p."createdAt",
             u.name AS "senderNama", u.username AS "senderUsername"
      FROM "tiket_pesan" p
      LEFT JOIN "user" u ON u.id = p."senderId"
      WHERE p."tiketId" = ${id}
      ORDER BY p."createdAt" ASC
    `

    const role = cs ? 'CS' : 'USER'

    return NextResponse.json({
      data: rows.map(r => ({ ...r, isMine: r.senderType === role })),
      role,
      message: 'Data berhasil diambil'
    })
  } catch (error) {
    console.error('Get pesan tiket error:', error)

    return NextResponse.json({ message: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

// POST /api/tiket/[id]/pesan  { pesan } — balas tiket
async function handlePost(request: NextRequest, { user, params }: ParamCtx) {
  try {
    const { id } = params
    const { pesan } = await request.json()

    if (!pesan || !String(pesan).trim()) {
      return NextResponse.json({ message: 'Pesan wajib diisi' }, { status: 400 })
    }

    const { tiket, cs, allowed } = await getTiketAndRole(id, user)

    if (!tiket) return NextResponse.json({ message: 'Tiket tidak ditemukan' }, { status: 404 })
    if (!allowed) return NextResponse.json({ message: 'Tidak diizinkan' }, { status: 403 })

    if (tiket.status === 'CLOSED') {
      return NextResponse.json({ message: 'Tiket sudah ditutup' }, { status: 400 })
    }

    const senderType = cs ? 'CS' : 'USER'

    await prisma.$executeRaw`
      INSERT INTO "tiket_pesan" (id, "tiketId", "senderId", "senderType", pesan, "createdAt")
      VALUES (${randomUUID()}, ${id}, ${user.id}, ${senderType}, ${String(pesan).trim()}, NOW())
    `

    // Balasan CS menandai tiket sedang diproses
    if (cs && tiket.status === 'OPEN') {
      await prisma.$executeRaw`UPDATE "tiket" SET status = 'IN PROGRESS', "updatedAt" = NOW() WHERE id = ${id}`
    }

    return NextResponse.json({ message: 'Pesan terkirim' }, { status: 201 })
  } catch (error) {
    console.error('Kirim pesan tiket error:', error)

    return NextResponse.json({ message: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

export const GET = withAuth<{ id: string }>(handleGet)
export const POST = withAuth<{ id: string }>(handlePost)
