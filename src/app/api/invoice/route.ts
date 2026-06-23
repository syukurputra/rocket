import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import prisma from '@/src/libs/prisma'
import { withAuth, type AuthContext } from '@/src/libs/auth-middleware'
import { sendInvoiceNotificationEmail } from '@/src/mails/invoiceNotificationEmail'
import { createIpaymuPayment } from '@/src/libs/ipaymu'

// Generate invoice number: INV-YYYYMM-XXXXX
async function generateNomorInvoice(): Promise<string> {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const prefix = `INV-${year}${month}-`

  // Count existing invoices this month
  const count = await prisma.invoice.count({
    where: {
      nomorInvoice: { startsWith: prefix }
    }
  })

  return `${prefix}${String(count + 1).padStart(5, '0')}`
}

// GET /api/invoice - List invoices for the current company
async function handleGet(request: NextRequest, { user }: AuthContext) {
  try {
    if (!user.companyId) {
      return NextResponse.json({ message: 'Tidak terhubung dengan perusahaan' }, { status: 400 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status') || ''
    const skip = (page - 1) * limit

    const where: any = { companyId: user.companyId }

    if (status) where.status = status

    const [invoices, totalCount] = await Promise.all([
      prisma.invoice.findMany({
        where,
        include: {
          paket: {
            select: { id: true, nama: true, hargaBulanan: true, hargaTahunan: true }
          },
          createdBy: {
            select: { id: true, username: true, email: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.invoice.count({ where })
    ])

    const totalPages = Math.ceil(totalCount / limit)

    return NextResponse.json({
      data: invoices,
      pagination: {
        totalCount,
        totalPages,
        page,
        limit,
        hasNext: page < totalPages,
        hasPrev: page > 1
      },
      message: 'Data invoice berhasil diambil'
    })
  } catch (error) {
    console.error('Get invoices error:', error)

    return NextResponse.json({ message: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

// POST /api/invoice - Create invoice when subscribing to a paket
async function handlePost(request: NextRequest, { user }: AuthContext) {
  try {
    if (!user.companyId) {
      return NextResponse.json({ message: 'Tidak terhubung dengan perusahaan' }, { status: 400 })
    }

    const body = await request.json()
    const { paketId, billingCycle = 'annually', catatan } = body

    if (!paketId) {
      return NextResponse.json({ message: 'paketId harus diisi' }, { status: 400 })
    }

    // Verify paket exists
    const paket = await prisma.masterPaket.findUnique({
      where: { id: paketId }
    })

    if (!paket) {
      return NextResponse.json({ message: 'Paket tidak ditemukan' }, { status: 404 })
    }

    if (!paket.status) {
      return NextResponse.json({ message: 'Paket tidak aktif' }, { status: 400 })
    }

    // Calculate amounts
    const harga = billingCycle === 'annually'
      ? Number(paket.hargaTahunan)
      : Number(paket.hargaBulanan)

    const subtotal = harga
    const pajak = Math.round(subtotal * 0.11) // PPN 11%
    const total = subtotal + pajak

    // Due date: match billing cycle
    const tanggalJatuhTempo = new Date()

    if (billingCycle === 'annually') {
      tanggalJatuhTempo.setFullYear(tanggalJatuhTempo.getFullYear() + 1)
    } else {
      tanggalJatuhTempo.setMonth(tanggalJatuhTempo.getMonth() + 1)
    }

    // Generate invoice number
    const nomorInvoice = await generateNomorInvoice()

    // Create invoice
    const invoice = await prisma.invoice.create({
      data: {
        nomorInvoice,
        status: 'PENDING',
        billingCycle,
        subtotal,
        pajak,
        total,
        catatan: catatan || null,
        tanggalJatuhTempo,
        companyId: user.companyId,
        paketId,
        createdById: user.id
      },
      include: {
        paket: {
          select: { id: true, nama: true, hargaBulanan: true, hargaTahunan: true }
        },
        createdBy: {
          select: { id: true, username: true, email: true }
        }
      }
    })

    // Generate iPaymu Payment Link
    let paymentUrl = ''
    try {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || (request.headers.get('origin') ?? 'http://localhost:3000')
      
      const ipaymuResult = await createIpaymuPayment({
        transactionId: nomorInvoice,
        amount: total,
        buyerName: user.name || user.username || 'Customer',
        buyerEmail: user.email || 'customer@example.com',
        buyerPhone: '081234567890', // Hardcoded as fallback since user phone might not be in auth context
        product: [`Langganan ${paket.nama} - ${billingCycle}`],
        qty: ['1'],
        price: [total.toString()],
        description: [`Pembayaran invoice ${nomorInvoice}`],
        returnUrl: `${baseUrl}/setting/invoice`,
        cancelUrl: `${baseUrl}/setting/invoice`,
        notifyUrl: `${baseUrl}/api/ipaymu/notify`
      })

      paymentUrl = ipaymuResult.Data.Url

      // Update invoice with session ID and Payment URL
      await prisma.invoice.update({
        where: { id: invoice.id },
        data: {
          ipaymuSessionId: ipaymuResult.Data.SessionID,
          paymentUrl: paymentUrl
        }
      })
      
      Object.assign(invoice, {
        paymentUrl: paymentUrl,
        ipaymuSessionId: ipaymuResult.Data.SessionID
      })

    } catch (paymentError) {
      console.error('Failed to create iPaymu payment:', paymentError)
      // We don't fail the invoice creation if payment link fails, we can handle it later or retry
    }

    // Buat notifikasi di database per user (non-blocking)
    prisma.notifikasi.create({
      data: {
        title: 'Invoice Paket Belum Dibayar',
        subtitle: `${paket.nama} — ${nomorInvoice} — Rp ${total.toLocaleString('id-ID')}`,
        avatarIcon: 'tabler-receipt',
        avatarColor: 'primary',
        type: 'invoice',
        url: `/setting/invoice/preview/${invoice.id}`,
        refId: invoice.id,
        userId: user.id
      }
    }).catch(err => console.error('Failed to create notifikasi:', err))

    // Send email notification to the user who created the invoice (non-blocking)
    const emailTo = user.email

    if (emailTo) {
      sendInvoiceNotificationEmail(emailTo, 'PENDING', {
        nomorInvoice,
        userName: user.username || user.email || 'Pengguna',
        paketName: paket.nama,
        billingCycle,
        subtotal,
        pajak,
        total,
        tanggalInvoice: invoice.tanggalInvoice.toISOString(),
        tanggalJatuhTempo: tanggalJatuhTempo.toISOString(),
        catatan: catatan || null
      }).then(result => {
        if (result.success) {
          console.log('Invoice email sent to:', emailTo)
        } else {
          console.error('Failed to send invoice email:', result.error)
        }
      }).catch(err => console.error('Invoice email error:', err))
    } else {
      console.warn('No email found for user:', user.id)
    }

    return NextResponse.json(
      {
        data: invoice,
        message: `Invoice ${nomorInvoice} berhasil dibuat`
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Create invoice error:', error)

    return NextResponse.json({ message: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

export const GET = withAuth(handleGet)
export const POST = withAuth(handlePost)
