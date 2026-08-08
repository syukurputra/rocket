import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import prisma from '@/src/libs/prisma'
import { withAuth, type AuthContext } from '@/src/libs/auth-middleware'
import { formatAlamatLengkap } from '@/src/libs/alamatPemesan'

type ParamCtx = AuthContext & { params: { id: string } }

// GET /api/booking/[id] — detail booking untuk halaman Detail Booking
async function handleGet(_request: NextRequest, { user, params }: ParamCtx) {
  try {
    const { id } = params

    const tagihan = await prisma.tagihan.findUnique({
      where: { id },
      include: {
        penyewa: { select: { id: true, nama: true, nomorTelepon: true, email: true, status: true } },
        aset: { select: { id: true, nama: true, alamatPemesanAktif: true } },
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

    // Alamat pemesan diambil dari profil user penyewa (menu My Profile →
    // Informasi Alamat), bukan dari data penyewa, supaya selalu mengikuti
    // alamat terbaru yang diisi sendiri oleh pemesan.
    let alamatPemesan: string | null = null

    if (tagihan.aset?.alamatPemesanAktif) {
      const profil = await prisma.user.findUnique({
        where: { id: tagihan.penyewaId },
        select: { alamat: true, provinsi: true, kota: true, kecamatan: true, kelurahan: true }
      })

      alamatPemesan = formatAlamatLengkap(profil) || null
    }

    const { ruangan, ...rest } = tagihan

    return NextResponse.json({
      data: {
        ...rest,
        itemAset: ruangan,
        nomorTagihan: nomorRows[0]?.nomorTagihan ?? null,
        alamatPemesan
      },
      message: 'Data berhasil diambil'
    })
  } catch (error) {
    console.error('Get booking detail error:', error)

    return NextResponse.json({ message: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

export const GET = withAuth<{ id: string }>(handleGet)
