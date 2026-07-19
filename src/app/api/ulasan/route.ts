import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'

import prisma from '@/src/libs/prisma'
import { withAuth, type AuthContext } from '@/src/libs/auth-middleware'

export const runtime = 'nodejs'

// GET /api/ulasan?tagihanId=... — ambil ulasan milik sebuah tagihan (untuk cek sudah diulas)
async function handleGet(request: NextRequest, { user }: AuthContext) {
  try {
    const { searchParams } = new URL(request.url)
    const tagihanId = searchParams.get('tagihanId')

    if (!tagihanId) {
      return NextResponse.json({ message: 'tagihanId wajib diisi' }, { status: 400 })
    }

    const rows = await prisma.$queryRaw<{ id: string; rating: number; komentar: string | null; createdAt: Date }[]>`
      SELECT id, rating, komentar, "createdAt" FROM "ulasan" WHERE "tagihanId" = ${tagihanId} LIMIT 1
    `

    return NextResponse.json({ data: rows[0] || null })
  } catch (error) {
    console.error('Get ulasan error:', error)

    return NextResponse.json({ message: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

// POST /api/ulasan  { tagihanId, rating, komentar }
// Penyewa memberi ulasan untuk booking-nya yang sudah LUNAS
async function handlePost(request: NextRequest, { user }: AuthContext) {
  try {
    const body = await request.json()
    const { tagihanId, rating, komentar } = body

    const ratingNum = Number(rating)

    if (!tagihanId || !ratingNum || ratingNum < 1 || ratingNum > 5) {
      return NextResponse.json({ message: 'tagihanId dan rating (1-5) wajib diisi' }, { status: 400 })
    }

    // Ambil data tagihan + nama penyewa
    const rows = await prisma.$queryRaw<
      {
        status: string
        companyId: string
        asetId: string | null
        itemAsetId: string | null
        penyewaId: string
        penyewaNama: string | null
      }[]
    >`
      SELECT t.status, t."companyId", t."asetId", t."itemAsetId", t."penyewaId", p.nama AS "penyewaNama"
      FROM "tagihan" t LEFT JOIN "penyewa" p ON p.id = t."penyewaId"
      WHERE t.id = ${tagihanId}
    `

    const t = rows[0]

    if (!t) {
      return NextResponse.json({ message: 'Tagihan tidak ditemukan' }, { status: 404 })
    }

    if (t.status !== 'LUNAS') {
      return NextResponse.json({ message: 'Ulasan hanya untuk booking yang sudah lunas' }, { status: 400 })
    }

    // Hanya penyewa pemilik booking yang boleh mengulas
    if (t.penyewaId !== user.id) {
      return NextResponse.json({ message: 'Tidak diizinkan mengulas booking ini' }, { status: 403 })
    }

    if (!t.asetId) {
      return NextResponse.json({ message: 'Booking tidak terkait aset' }, { status: 400 })
    }

    const nama = t.penyewaNama || user.name || user.username || 'Pengguna'
    const komentarVal = komentar ? String(komentar).trim() : null

    // Sudah pernah mengulas? → update, jika belum → insert
    const existing = await prisma.$queryRaw<{ id: string }[]>`
      SELECT id FROM "ulasan" WHERE "tagihanId" = ${tagihanId} LIMIT 1
    `

    if (existing.length > 0) {
      await prisma.$executeRaw`
        UPDATE "ulasan"
        SET rating = ${ratingNum}, komentar = ${komentarVal}, nama = ${nama}, "updatedAt" = NOW()
        WHERE id = ${existing[0].id}
      `

      return NextResponse.json({ data: { id: existing[0].id }, message: 'Ulasan diperbarui' })
    }

    const id = randomUUID()

    await prisma.$executeRaw`
      INSERT INTO "ulasan" (id, "companyId", "asetId", "itemAsetId", "penyewaId", "tagihanId", nama, rating, komentar, "createdAt", "updatedAt")
      VALUES (${id}, ${t.companyId}, ${t.asetId}, ${t.itemAsetId}, ${t.penyewaId}, ${tagihanId}, ${nama}, ${ratingNum}, ${komentarVal}, NOW(), NOW())
    `

    return NextResponse.json({ data: { id }, message: 'Ulasan berhasil dikirim' }, { status: 201 })
  } catch (error) {
    console.error('Create ulasan error:', error)

    return NextResponse.json({ message: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

export const GET = withAuth(handleGet)
export const POST = withAuth(handlePost)
