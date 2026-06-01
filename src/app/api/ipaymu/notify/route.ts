import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/src/libs/prisma'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const status = formData.get('status') as string
    const referenceId = formData.get('reference_id') as string // This is our nomorInvoice
    const trxId = formData.get('trx_id') as string
    
    // Fallback to json if not formData
    // let body
    // if (!status && !referenceId) {
    //   body = await request.json()
    //   status = body.status
    //   referenceId = body.reference_id
    //   trxId = body.trx_id
    // }

    if (!referenceId) {
      return NextResponse.json({ message: 'Missing reference_id' }, { status: 400 })
    }

    console.log(`[iPaymu Webhook] Received status ${status} for ${referenceId}`)

    // Find the invoice
    const invoice = await prisma.invoice.findUnique({
      where: { nomorInvoice: referenceId }
    })

    if (!invoice) {
      return NextResponse.json({ message: 'Invoice not found' }, { status: 404 })
    }

    let newStatus = invoice.status
    let tanggalBayar = invoice.tanggalBayar

    // Map iPaymu status to our system
    // iPaymu status: 'berhasil', 'pending', 'expired' (based on generic payment gateway standard, iPaymu uses lowercase ID)
    if (status?.toLowerCase() === 'berhasil') {
      newStatus = 'PAID'
      tanggalBayar = new Date()
    } else if (status?.toLowerCase() === 'expired') {
      newStatus = 'EXPIRED'
    } else if (status?.toLowerCase() === 'gagal') {
      newStatus = 'CANCELLED'
    }

    if (newStatus !== invoice.status) {
      await prisma.invoice.update({
        where: { id: invoice.id },
        data: {
          status: newStatus,
          tanggalBayar,
          catatan: invoice.catatan 
            ? `${invoice.catatan}\n\n[System] iPaymu Trx ID: ${trxId} - Status: ${status}`
            : `[System] iPaymu Trx ID: ${trxId} - Status: ${status}`
        }
      })
      console.log(`[iPaymu Webhook] Updated ${referenceId} to ${newStatus}`)
    }

    return NextResponse.json({ message: 'OK' })
  } catch (error) {
    console.error('[iPaymu Webhook] Error:', error)
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
  }
}
