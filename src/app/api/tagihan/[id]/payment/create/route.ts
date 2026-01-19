import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import prisma from '@/src/libs/prisma'
import { withAuth, type AuthContext } from '@/src/libs/auth-middleware'
import { createMidtransTransaction } from '@/src/libs/midtrans'
import { sendPaymentInstructionEmail } from '@/src/mails/paymentInstructionEmail'

type ParamCtx = AuthContext & { params: { id: string } }

async function handlePost(request: NextRequest, { user, params }: ParamCtx) {
  try {
    const { id } = await params

    // Find tagihan with penghuni details
    const tagihan = await prisma.tagihan.findUnique({
      where: { id },
      include: {
        penghuni: {
          select: {
            id: true,
            nama: true,
            email: true,
            nomorTelepon: true
          }
        }
      }
    })

    if (!tagihan) {
      return NextResponse.json({ message: 'Tagihan tidak ditemukan' }, { status: 404 })
    }

    // Check if already paid
    if (tagihan.status === 'LUNAS') {
      return NextResponse.json({ message: 'Tagihan sudah dibayar' }, { status: 400 })
    }

    // Check if penghuni has email
    if (!tagihan.penghuni?.email) {
      return NextResponse.json(
        { message: 'Email penghuni tidak tersedia. Tidak dapat mengirim link pembayaran.' },
        { status: 400 }
      )
    }

    // Generate unique order ID
    const timestamp = Date.now()
    const orderId = `INV-${tagihan.id}-${timestamp}`

    // Create Midtrans transaction
    const transaction = await createMidtransTransaction({
      orderId,
      grossAmount: Number(tagihan.nominal),
      customerDetails: {
        first_name: tagihan.penghuni.nama,
        email: tagihan.penghuni.email,
        phone: tagihan.penghuni.nomorTelepon || undefined
      },
      itemDetails: [
        {
          id: tagihan.id,
          price: Number(tagihan.nominal),
          quantity: 1,
          name: tagihan.keterangan
        }
      ]
    })

    // Update tagihan with payment info
    await prisma.tagihan.update({
      where: { id },
      data: {
        midtransOrderId: orderId,
        paymentUrl: transaction.redirect_url,
        updatedById: user.id
      }
    })

    // Send payment instruction email
    await sendPaymentInstructionEmail(
      tagihan.penghuni.email,
      tagihan.penghuni.nama,
      tagihan.keterangan,
      tagihan.mulaiSewa.toISOString(),
      tagihan.selesaiSewa.toISOString(),
      Number(tagihan.nominal),
      transaction.redirect_url
    )

    return NextResponse.json({
      message: 'Link pembayaran berhasil dibuat dan email telah dikirim',
      data: {
        orderId,
        paymentUrl: transaction.redirect_url,
        token: transaction.token
      }
    })
  } catch (error) {
    console.error('Create payment error:', error)

    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

export const POST = withAuth<{ id: string }>(handlePost)
