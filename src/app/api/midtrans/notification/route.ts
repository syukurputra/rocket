import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import prisma from '@/src/libs/prisma'
import { verifySignature } from '@/src/libs/midtrans'
import { sendPaymentConfirmationEmail } from '@/src/mails/paymentConfirmationEmail'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const {
      order_id,
      transaction_status,
      fraud_status,
      payment_type,
      gross_amount,
      transaction_id,
      transaction_time,
      status_code,
      signature_key
    } = body

    console.log('Midtrans notification received:', {
      order_id,
      transaction_status,
      payment_type
    })

    // Verify signature
    const isValidSignature = verifySignature(order_id, status_code, gross_amount, signature_key)

    if (!isValidSignature) {
      console.error('Invalid signature for order:', order_id)

      return NextResponse.json({ message: 'Invalid signature' }, { status: 403 })
    }

    // Find tagihan by midtransOrderId
    const tagihan = await prisma.tagihan.findUnique({
      where: { midtransOrderId: order_id },
      include: {
        penyewa: {
          select: {
            id: true,
            nama: true,
            email: true
          }
        }
      }
    })

    if (!tagihan) {
      console.error('Tagihan not found for order:', order_id)

      return NextResponse.json({ message: 'Tagihan not found' }, { status: 404 })
    }

    // Determine payment status
    let shouldUpdateToLunas = false
    let newTransactionStatus = transaction_status

    if (transaction_status === 'capture') {
      if (fraud_status === 'accept') {
        shouldUpdateToLunas = true
      }
    } else if (transaction_status === 'settlement') {
      shouldUpdateToLunas = true
    } else if (transaction_status === 'pending') {
      newTransactionStatus = 'pending'
    } else if (['deny', 'expire', 'cancel'].includes(transaction_status)) {
      newTransactionStatus = transaction_status
    }

    // Update tagihan
    const updateData: any = {
      midtransTransactionId: transaction_id,
      midtransTransactionStatus: newTransactionStatus,
      midtransPaymentType: payment_type,
      midtransTransactionTime: new Date(transaction_time)
    }

    if (shouldUpdateToLunas) {
      updateData.status = 'LUNAS'
      updateData.metodeBayar = payment_type
    }

    const updatedTagihan = await prisma.tagihan.update({
      where: { id: tagihan.id },
      data: updateData,
      include: {
        penyewa: {
          select: {
            id: true,
            nama: true,
            email: true
          }
        }
      }
    })

    // If payment successful, update penyewaand send confirmation email
    if (shouldUpdateToLunas && tagihan.penyewaId) {
      // Update penyewa status
      await prisma.penyewa.update({
        where: { id: tagihan.penyewaId },
        data: {
          mulaiSewa: tagihan.mulaiSewa,
          selesaiSewa: tagihan.selesaiSewa,
          status: 'sudah terbayar',
          updatedById: tagihan.updatedById
        }
      })

      // Send confirmation email
      if (updatedTagihan.penyewa?.email) {
        try {
          await sendPaymentConfirmationEmail(
            updatedTagihan.penyewa.email,
            updatedTagihan.penyewa.nama,
            updatedTagihan.keterangan,
            updatedTagihan.mulaiSewa.toISOString(),
            updatedTagihan.selesaiSewa.toISOString(),
            Number(updatedTagihan.nominal),
            payment_type
          )
          console.log('Payment confirmation email sent to:', updatedTagihan.penyewa.email)
        } catch (emailError) {
          console.error('Failed to send confirmation email:', emailError)
          // Don't fail the webhook if email fails
        }
      }
    }

    console.log('Tagihan updated successfully:', {
      id: tagihan.id,
      status: updateData.status || tagihan.status,
      transactionStatus: newTransactionStatus
    })

    return NextResponse.json({
      message: 'Notification processed successfully',
      data: {
        orderId: order_id,
        status: updateData.status || tagihan.status
      }
    })
  } catch (error) {
    console.error('Midtrans notification error:', error)

    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
