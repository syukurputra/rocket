import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import prisma from '@/src/libs/prisma'
import { withAuth, type AuthContext } from '@/src/libs/auth-middleware'
import { deleteFromS3, getS3KeyFromUrl } from '@/src/libs/s3'

type ParamCtx = AuthContext & { params: { id: string } }

async function handleGet(request: NextRequest, { params }: ParamCtx) {
  try {
    const { id } = params

    const rows = await prisma.$queryRaw<any[]>`
      SELECT * FROM banner_promo WHERE id = ${id}
    `

    if (rows.length === 0) {
      return NextResponse.json({ message: 'Banner promo tidak ditemukan' }, { status: 404 })
    }

    return NextResponse.json({ data: rows[0], message: 'Data berhasil diambil' })
  } catch (error) {
    console.error('Get banner promo by ID error:', error)

    return NextResponse.json({ message: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

async function handlePut(request: NextRequest, { params }: ParamCtx) {
  try {
    const { id } = params
    const body = await request.json()
    const { judul, deskripsi, tampilkanPeriode, periodeAwal, periodeAkhir, status } = body

    const existing = await prisma.$queryRaw<any[]>`SELECT id FROM banner_promo WHERE id = ${id}`

    if (existing.length === 0) {
      return NextResponse.json({ message: 'Banner promo tidak ditemukan' }, { status: 404 })
    }

    const now = new Date()

    if (judul !== undefined) {
      await prisma.$executeRaw`UPDATE banner_promo SET judul = ${judul}, "updatedAt" = ${now} WHERE id = ${id}`
    }

    if (deskripsi !== undefined) {
      await prisma.$executeRaw`UPDATE banner_promo SET deskripsi = ${deskripsi || null}, "updatedAt" = ${now} WHERE id = ${id}`
    }

    if (tampilkanPeriode !== undefined) {
      if (tampilkanPeriode) {
        const awal = periodeAwal ? new Date(periodeAwal) : null
        const akhir = periodeAkhir ? new Date(periodeAkhir) : null

        await prisma.$executeRaw`UPDATE banner_promo SET "tampilkanPeriode" = true, "periodeAwal" = ${awal}, "periodeAkhir" = ${akhir}, "updatedAt" = ${now} WHERE id = ${id}`
      } else {
        await prisma.$executeRaw`UPDATE banner_promo SET "tampilkanPeriode" = false, "periodeAwal" = NULL, "periodeAkhir" = NULL, "updatedAt" = ${now} WHERE id = ${id}`
      }
    } else {
      if (periodeAwal !== undefined) {
        const awal = periodeAwal ? new Date(periodeAwal) : null

        await prisma.$executeRaw`UPDATE banner_promo SET "periodeAwal" = ${awal}, "updatedAt" = ${now} WHERE id = ${id}`
      }

      if (periodeAkhir !== undefined) {
        const akhir = periodeAkhir ? new Date(periodeAkhir) : null

        await prisma.$executeRaw`UPDATE banner_promo SET "periodeAkhir" = ${akhir}, "updatedAt" = ${now} WHERE id = ${id}`
      }
    }

    if (status !== undefined) {
      await prisma.$executeRaw`UPDATE banner_promo SET status = ${status}, "updatedAt" = ${now} WHERE id = ${id}`
    }

    const rows = await prisma.$queryRaw<any[]>`SELECT * FROM banner_promo WHERE id = ${id}`

    return NextResponse.json({ data: rows[0], message: 'Banner promo berhasil diupdate' })
  } catch (error) {
    console.error('Update banner promo error:', error)

    return NextResponse.json({ message: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

async function handleDelete(request: NextRequest, { params }: ParamCtx) {
  try {
    const { id } = params

    const existing = await prisma.$queryRaw<{ imageUrl: string | null }[]>`
      SELECT "imageUrl" FROM banner_promo WHERE id = ${id}
    `

    if (existing.length === 0) {
      return NextResponse.json({ message: 'Banner promo tidak ditemukan' }, { status: 404 })
    }

    if (existing[0].imageUrl) {
      try {
        const key = getS3KeyFromUrl(existing[0].imageUrl)

        if (key) await deleteFromS3(key)
      } catch (e) {
        console.error('Failed to delete S3 image:', e)
      }
    }

    await prisma.$executeRaw`DELETE FROM banner_promo WHERE id = ${id}`

    return NextResponse.json({ message: 'Banner promo berhasil dihapus' })
  } catch (error) {
    console.error('Delete banner promo error:', error)

    return NextResponse.json({ message: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

export const GET = withAuth<{ id: string }>(handleGet)
export const PUT = withAuth<{ id: string }>(handlePut)
export const DELETE = withAuth<{ id: string }>(handleDelete)
