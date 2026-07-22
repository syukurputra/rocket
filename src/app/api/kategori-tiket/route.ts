import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'

import prisma from '@/src/libs/prisma'
import { withAuth, type AuthContext } from '@/src/libs/auth-middleware'

export const runtime = 'nodejs'

// GET /api/kategori-tiket?aktifOnly=true — daftar kategori tiket
async function handleGet(request: NextRequest, _ctx: AuthContext) {
  try {
    const { searchParams } = new URL(request.url)
    const aktifOnly = searchParams.get('aktifOnly') === 'true'

    const rows = aktifOnly
      ? await prisma.$queryRaw<any[]>`
          SELECT id, nama, deskripsi, status, "createdAt" FROM "kategori_tiket"
          WHERE status = true ORDER BY nama ASC
        `
      : await prisma.$queryRaw<any[]>`
          SELECT id, nama, deskripsi, status, "createdAt" FROM "kategori_tiket"
          ORDER BY "createdAt" DESC
        `

    return NextResponse.json({ data: rows, message: 'Data berhasil diambil' })
  } catch (error) {
    console.error('Get kategori tiket error:', error)

    return NextResponse.json({ message: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

// POST /api/kategori-tiket  { nama, deskripsi, status }
async function handlePost(request: NextRequest, _ctx: AuthContext) {
  try {
    const { nama, deskripsi, status = true } = await request.json()

    if (!nama || !String(nama).trim()) {
      return NextResponse.json({ message: 'Nama kategori wajib diisi' }, { status: 400 })
    }

    const id = randomUUID()

    await prisma.$executeRaw`
      INSERT INTO "kategori_tiket" (id, nama, deskripsi, status, "createdAt", "updatedAt")
      VALUES (${id}, ${String(nama).trim()}, ${deskripsi || null}, ${!!status}, NOW(), NOW())
    `

    return NextResponse.json({ data: { id }, message: 'Kategori tiket berhasil dibuat' }, { status: 201 })
  } catch (error) {
    console.error('Create kategori tiket error:', error)

    return NextResponse.json({ message: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

export const GET = withAuth(handleGet)
export const POST = withAuth(handlePost)
