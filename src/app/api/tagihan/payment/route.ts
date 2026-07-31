import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import prisma from '@/src/libs/prisma'
import { withAuth, type AuthContext } from '@/src/libs/auth-middleware'
import { createIpaymuPayment } from '@/src/libs/ipaymu'
import { STATUS_TAGIHAN } from '@/src/libs/orderPayment'

async function handlePost(request: NextRequest, { user }: AuthContext) {
  try {
    const body = await request.json()
    const { tagihanId } = body

    if (!tagihanId) {
      return NextResponse.json({ message: 'tagihanId harus diisi' }, { status: 400 })
    }

    const tagihan = await prisma.tagihan.findUnique({
      where: { id: tagihanId },
      include: {
        penyewa: {
          select: { id: true, nama: true, email: true, nomorTelepon: true }
        }
      }
    })

    if (!tagihan) {
      return NextResponse.json({ message: 'Tagihan tidak ditemukan' }, { status: 404 })
    }

    if (tagihan.status === 'LUNAS') {
      return NextResponse.json({ message: 'Tagihan sudah lunas' }, { status: 400 })
    }

    // Booking yang masih menunggu persetujuan pemilik belum boleh dibayar
    if (tagihan.status === STATUS_TAGIHAN.menungguKonfirmasi) {
      return NextResponse.json({ message: 'Booking masih menunggu konfirmasi pemilik' }, { status: 409 })
    }

    if (tagihan.status === STATUS_TAGIHAN.dibatalkan) {
      return NextResponse.json({ message: 'Booking sudah dibatalkan' }, { status: 409 })
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || (request.headers.get('origin') ?? 'http://localhost:3000')

    const nominal = Number(tagihan.nominal)

    const ipaymuResult = await createIpaymuPayment({
      transactionId: tagihanId,
      amount: nominal,
      buyerName: tagihan.penyewa?.nama || user.username || 'Customer',
      buyerEmail: tagihan.penyewa?.email || user.email || 'customer@example.com',
      buyerPhone: tagihan.penyewa?.nomorTelepon || '081234567890',
      product: [tagihan.keterangan],
      qty: ['1'],
      price: [nominal.toString()],
      description: [tagihan.keterangan],
      returnUrl: `${baseUrl}/booking/saya`,
      cancelUrl: `${baseUrl}/booking/saya`,
      notifyUrl: `${baseUrl}/api/ipaymu/notify`
    })

    // Simpan paymentUrl dan sessionId ke tagihan
    await prisma.tagihan.update({
      where: { id: tagihanId },
      data: {
        paymentUrl: ipaymuResult.Data.Url,
        ipaymuSessionId: ipaymuResult.Data.SessionID
      }
    })

    return NextResponse.json({
      data: {
        paymentUrl: ipaymuResult.Data.Url,
        sessionId: ipaymuResult.Data.SessionID,
        referenceId: tagihanId
      },
      message: 'Payment link berhasil dibuat'
    })
  } catch (error) {
    console.error('Create tagihan payment error:', error)

    return NextResponse.json({
      message: error instanceof Error ? error.message : 'Terjadi kesalahan server'
    }, { status: 500 })
  }
}

export const POST = withAuth(handlePost)
