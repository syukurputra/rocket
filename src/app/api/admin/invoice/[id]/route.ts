import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import prisma from '@/src/libs/prisma'
import { withAuth, type AuthContext } from '@/src/libs/auth-middleware'
import { sendInvoiceNotificationEmail } from '@/src/mails/invoiceNotificationEmail'

// PATCH /api/admin/invoice/[id] - Admin approve (PAID) or reject (PENDING) invoice
async function handlePatch(request: NextRequest, { user, params }: AuthContext & { params: { id: string } }) {
  try {
    const body = await request.json()
    const { status, catatan } = body

    const validStatuses = ['PENDING', 'PAID', 'CANCELLED', 'EXPIRED']

    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json({ message: 'Status tidak valid' }, { status: 400 })
    }

    const existing = await prisma.invoice.findUnique({ where: { id: params.id } })

    if (!existing) {
      return NextResponse.json({ message: 'Invoice tidak ditemukan' }, { status: 404 })
    }

    const updateData: any = { status }

    if (status === 'PAID') {
      updateData.tanggalBayar = new Date()
    }

    if (catatan !== undefined) {
      updateData.catatan = catatan
    }

    const invoice = await prisma.invoice.update({
      where: { id: params.id },
      data: updateData,
      include: {
        paket: { select: { id: true, nama: true } },
        company: { select: { id: true, nama: true } },
        createdBy: { select: { id: true, email: true } }
      }
    })

    // When invoice is PAID, activate the paket for the company
    if (status === 'PAID' && invoice.companyId && invoice.paketId) {
      const now = new Date()
      const endDate = new Date(now)

      if (invoice.billingCycle === 'annually') {
        endDate.setFullYear(endDate.getFullYear() + 1)
      } else {
        endDate.setMonth(endDate.getMonth() + 1)
      }

      await prisma.company.update({
        where: { id: invoice.companyId },
        data: {
          paketId: invoice.paketId,
          paketStartDate: now,
          paketEndDate: endDate
        }
      })
    }

    // Send email notification for PAID or CANCELLED (non-blocking)
    if (status === 'PAID' || status === 'CANCELLED') {
      const emailTo = invoice.createdBy?.email

      if (emailTo) {
        sendInvoiceNotificationEmail(emailTo, status as 'PAID' | 'CANCELLED', {
          nomorInvoice: invoice.nomorInvoice,
          companyName: invoice.company?.nama || '-',
          paketName: invoice.paket?.nama || '-',
          billingCycle: invoice.billingCycle,
          subtotal: Number(invoice.subtotal),
          pajak: Number(invoice.pajak),
          total: Number(invoice.total),
          tanggalInvoice: invoice.tanggalInvoice.toISOString(),
          tanggalJatuhTempo: invoice.tanggalJatuhTempo.toISOString(),
          catatan: invoice.catatan
        }).then(result => {
          if (result.success) {
            console.log(`Invoice ${status} email sent to:`, emailTo)
          } else {
            console.error('Failed to send invoice status email:', result.error)
          }
        }).catch(err => console.error('Invoice status email error:', err))
      }
    }

    return NextResponse.json({ data: invoice, message: 'Status invoice berhasil diperbarui' })
  } catch (error) {
    console.error('Admin update invoice error:', error)

    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

export const PATCH = withAuth(handlePatch)
