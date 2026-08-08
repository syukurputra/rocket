import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import prisma from '@/src/libs/prisma'
import { withAuth, type AuthContext } from '@/src/libs/auth-middleware'
import { generateBookingPdf } from '@/src/libs/pdf/bookingPdf'
import { getParameter } from '@/src/libs/getParameter'
import { formatAlamatLengkap } from '@/src/libs/alamatPemesan'

async function handleGet(request: NextRequest, { user, params }: AuthContext & { params: { id: string } }) {
  try {
    const DEMO_COMPANY_ID = await getParameter('COMPANY_SUPER')
    const { id } = params

    const tagihan = await prisma.tagihan.findUnique({
      where: { id },
      include: {
        penyewa: { select: { id: true, nama: true, email: true, nomorTelepon: true } },
        aset: { select: { id: true, nama: true, alamatPemesanAktif: true } },
        ruangan: { select: { id: true, nama: true } },
        company: { select: { nama: true } }
      }
    })

    if (!tagihan) {
      return NextResponse.json({ message: 'Tagihan tidak ditemukan' }, { status: 404 })
    }

    const isSuper = !!DEMO_COMPANY_ID && user.companyId === DEMO_COMPANY_ID
    const isOwnerCompany = !!user.companyId && tagihan.companyId === user.companyId
    const isPenyewa = tagihan.penyewaId === user.id

    if (!isSuper && !isOwnerCompany && !isPenyewa) {
      return NextResponse.json({ message: 'Akses ditolak' }, { status: 403 })
    }

    // Ambil syarat & ketentuan aset (kolom Text, tidak ikut di select relasi)
    let syaratKetentuan: string | null = null

    if (tagihan.asetId) {
      const syaratRows = await prisma.$queryRaw<{ syaratKetentuan: string | null }[]>`
        SELECT "syaratKetentuan" FROM "aset" WHERE id = ${tagihan.asetId}
      `

      syaratKetentuan = syaratRows[0]?.syaratKetentuan ?? null
    }

    // Alamat pemesan diambil dari profil user penyewa, sama seperti di detail booking
    let alamatPemesan: string | null = null

    if (tagihan.aset?.alamatPemesanAktif) {
      const profil = await prisma.user.findUnique({
        where: { id: tagihan.penyewaId },
        select: { alamat: true, provinsi: true, kota: true, kecamatan: true, kelurahan: true }
      })

      alamatPemesan = formatAlamatLengkap(profil) || null
    }

    const buffer = generateBookingPdf({
      id: tagihan.id,
      nomorTagihan: tagihan.nomorTagihan,
      keterangan: tagihan.keterangan,
      nominal: Number(tagihan.nominal),
      periodeSewa: tagihan.periodeSewa,
      mulaiSewa: tagihan.mulaiSewa,
      selesaiSewa: tagihan.selesaiSewa,
      syaratKetentuan,
      penyewa: tagihan.penyewa,
      alamatPemesan,
      namaUsaha: tagihan.company?.nama ?? null,
      itemAset: tagihan.ruangan,
      aset: tagihan.aset
    })

    const filename = `booking-${tagihan.nomorTagihan || tagihan.id.slice(-8).toUpperCase()}.pdf`

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    })
  } catch (error) {
    console.error('Generate booking PDF error:', error)

    return NextResponse.json({ message: 'Gagal generate PDF' }, { status: 500 })
  }
}

export const GET = withAuth(handleGet)
