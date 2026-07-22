import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import prisma from '@/src/libs/prisma'
import { withAuth, type AuthContext } from '@/src/libs/auth-middleware'

export const runtime = 'nodejs'

type ParamCtx = AuthContext & { params: { id: string } }

// PUT /api/kategori-tiket/[id]
async function handlePut(request: NextRequest, { params }: ParamCtx) {
  try {
    const { id } = params
    const { nama, deskripsi, status } = await request.json()

    const existing = await prisma.$queryRaw<{ id: string }[]>`SELECT id FROM "kategori_tiket" WHERE id = ${id}`

    if (existing.length === 0) {
      return NextResponse.json({ message: 'Kategori tidak ditemukan' }, { status: 404 })
    }

    if (nama !== undefined) {
      await prisma.$executeRaw`UPDATE "kategori_tiket" SET nama = ${String(nama).trim()}, "updatedAt" = NOW() WHERE id = ${id}`
    }

    if (deskripsi !== undefined) {
      await prisma.$executeRaw`UPDATE "kategori_tiket" SET deskripsi = ${deskripsi || null}, "updatedAt" = NOW() WHERE id = ${id}`
    }

    if (status !== undefined) {
      await prisma.$executeRaw`UPDATE "kategori_tiket" SET status = ${!!status}, "updatedAt" = NOW() WHERE id = ${id}`
    }

    return NextResponse.json({ message: 'Kategori tiket berhasil diupdate' })
  } catch (error) {
    console.error('Update kategori tiket error:', error)

    return NextResponse.json({ message: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

// DELETE /api/kategori-tiket/[id]
async function handleDelete(_request: NextRequest, { params }: ParamCtx) {
  try {
    const { id } = params

    // Tolak jika masih dipakai tiket
    const used = await prisma.$queryRaw<{ c: number }[]>`
      SELECT COUNT(*)::int AS c FROM "tiket" WHERE "kategoriTiketId" = ${id}
    `

    if ((used[0]?.c ?? 0) > 0) {
      return NextResponse.json({ message: 'Kategori masih dipakai oleh tiket, tidak bisa dihapus' }, { status: 400 })
    }

    await prisma.$executeRaw`DELETE FROM "kategori_tiket" WHERE id = ${id}`

    return NextResponse.json({ message: 'Kategori tiket berhasil dihapus' })
  } catch (error) {
    console.error('Delete kategori tiket error:', error)

    return NextResponse.json({ message: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

export const PUT = withAuth<{ id: string }>(handlePut)
export const DELETE = withAuth<{ id: string }>(handleDelete)
