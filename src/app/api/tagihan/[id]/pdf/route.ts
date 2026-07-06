import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import prisma from '@/src/libs/prisma'
import { withAuth, type AuthContext } from '@/src/libs/auth-middleware'
import { generateBookingPdf } from '@/src/libs/pdf/bookingPdf'

const DEMO_COMPANY_ID = 'company-demo-001'

async function handleGet(request: NextRequest, { user, params }: AuthContext & { params: { id: string } }) {
  try {
    const { id } = params

    const tagihan = await prisma.tagihan.findUnique({
      where: { id },
      include: {
        penyewa: { select: { id: true, nama: true, email: true, nomorTelepon: true } },
        aset: { select: { id: true, nama: true } },
        ruangan: { select: { id: true, nama: true } }
      }
    })

    if (!tagihan) {
      return NextResponse.json({ message: 'Tagihan tidak ditemukan' }, { status: 404 })
    }

    if (user.companyId !== DEMO_COMPANY_ID && tagihan.companyId !== user.companyId) {
      return NextResponse.json({ message: 'Akses ditolak' }, { status: 403 })
    }

    const buffer = generateBookingPdf({
      id: tagihan.id,
      keterangan: tagihan.keterangan,
      nominal: Number(tagihan.nominal),
      periodeSewa: tagihan.periodeSewa,
      mulaiSewa: tagihan.mulaiSewa,
      selesaiSewa: tagihan.selesaiSewa,
      penyewa: tagihan.penyewa,
      ruangan: tagihan.ruangan,
      aset: tagihan.aset
    })

    const filename = `bukti-booking-${tagihan.id.slice(-8).toUpperCase()}.pdf`

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
