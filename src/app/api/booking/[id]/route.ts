import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import prisma from '@/src/libs/prisma'
import { withAuth, type AuthContext } from '@/src/libs/auth-middleware'

type ParamCtx = AuthContext & { params: { id: string } }

// GET /api/booking/[id] — detail booking untuk halaman Detail Booking
async function handleGet(_request: NextRequest, { user, params }: ParamCtx) {
  try {
    const { id } = params

    const tagihan = await prisma.tagihan.findUnique({
      where: { id },
      include: {
        penyewa: { select: { id: true, nama: true, nomorTelepon: true, email: true, status: true } },
        aset: { select: { id: true, nama: true } },
        ruangan: { select: { id: true, nama: true } }
      }
    })

    if (!tagihan) {
      return NextResponse.json({ message: 'Booking tidak ditemukan' }, { status: 404 })
    }

    // Boleh diakses oleh penyewa pemilik booking atau company pemilik aset
    const isPenyewa = tagihan.penyewaId === user.id
    const isCompany = !!user.companyId && tagihan.companyId === user.companyId

    if (!isPenyewa && !isCompany) {
      return NextResponse.json({ message: 'Tidak diizinkan' }, { status: 403 })
    }

    // nomorTagihan via raw SQL (kolom baru)
    const nomorRows = await prisma.$queryRaw<{ nomorTagihan: string | null }[]>`
      SELECT "nomorTagihan" FROM "tagihan" WHERE id = ${id}
    `

    const { ruangan, ...rest } = tagihan

    return NextResponse.json({
      data: {
        ...rest,
        itemAset: ruangan,
        nomorTagihan: nomorRows[0]?.nomorTagihan ?? null
      },
      message: 'Data berhasil diambil'
    })
  } catch (error) {
    console.error('Get booking detail error:', error)

    return NextResponse.json({ message: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

export const GET = withAuth<{ id: string }>(handleGet)
