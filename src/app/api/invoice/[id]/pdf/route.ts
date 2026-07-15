import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import prisma from '@/src/libs/prisma'
import { withAuth, type AuthContext } from '@/src/libs/auth-middleware'
import { generateInvoicePdf } from '@/src/libs/pdf/invoicePdf'
import { getParameter } from '@/src/libs/getParameter'

async function handleGet(request: NextRequest, { user, params }: AuthContext & { params: { id: string } }) {
  try {
    const DEMO_COMPANY_ID = await getParameter('COMPANY_SUPER')
    const { id } = params

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        paket: { select: { id: true, nama: true } },
        company: { select: { id: true, nama: true, alamat: true, email: true } }
      }
    })

    if (!invoice) {
      return NextResponse.json({ message: 'Invoice tidak ditemukan' }, { status: 404 })
    }

    if (user.companyId !== DEMO_COMPANY_ID && invoice.companyId !== user.companyId) {
      return NextResponse.json({ message: 'Akses ditolak' }, { status: 403 })
    }

    const buffer = generateInvoicePdf({
      nomorInvoice: invoice.nomorInvoice,
      tanggalInvoice: invoice.tanggalInvoice,
      tanggalBayar: invoice.tanggalBayar,
      subtotal: Number(invoice.subtotal),
      pajak: Number(invoice.pajak),
      total: Number(invoice.total),
      billingCycle: invoice.billingCycle,
      paket: invoice.paket,
      company: invoice.company
    })

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="invoice-${invoice.nomorInvoice}.pdf"`
      }
    })
  } catch (error) {
    console.error('Generate invoice PDF error:', error)

    return NextResponse.json({ message: 'Gagal generate PDF' }, { status: 500 })
  }
}

export const GET = withAuth(handleGet)
