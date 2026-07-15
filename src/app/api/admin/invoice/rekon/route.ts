import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import prisma from '@/src/libs/prisma'
import { withAuth, type AuthContext } from '@/src/libs/auth-middleware'

type RekonRow = {
  refId: string
  amount: number
  fee: number
  type: string
  paymentChannel: string
  paymentNo: string
  status: string
}

type RekonResult = {
  refId: string
  invoiceId?: string
  nomorInvoice?: string
  matched: boolean
  updated: boolean
  prevStatus?: string
  reason?: string
}

const BERHASIL_STATUSES = ['berhasil', 'success', 'paid', 'settlement']

// Raw SQL update untuk field rekon (Prisma client belum regenerasi)
async function saveRekonFields(invoiceId: string, amount: number, fee: number, type: string, channel: string, paymentNo: string) {
  await prisma.$executeRaw`
    UPDATE "invoice"
    SET
      "statusRekon"      = 'SESUAI',
      "amountPembayaran" = ${amount}::numeric,
      "amountFee"        = ${fee}::numeric,
      "typePembayaran"   = ${type},
      "paymentChannel"   = ${channel},
      "paymentNo"        = ${paymentNo},
      "updatedAt"        = NOW()
    WHERE id = ${invoiceId}
  `
}

async function markPaid(invoiceId: string, catatan: string, amount: number, fee: number, type: string, channel: string, paymentNo: string) {
  const now = new Date()

  await prisma.$executeRaw`
    UPDATE "invoice"
    SET
      "status"           = 'PAID',
      "tanggalBayar"     = ${now},
      "catatan"          = ${catatan},
      "statusRekon"      = 'SESUAI',
      "amountPembayaran" = ${amount}::numeric,
      "amountFee"        = ${fee}::numeric,
      "typePembayaran"   = ${type},
      "paymentChannel"   = ${channel},
      "paymentNo"        = ${paymentNo},
      "updatedAt"        = NOW()
    WHERE id = ${invoiceId}
  `

  return now
}

async function handlePost(request: NextRequest, { user }: AuthContext) {
  try {
    const isSuperAdmin =
      user.roleId === 'superadmin' ||
      user.role?.nama?.toLowerCase().replace(/\s+/g, '') === 'superadmin'

    if (!isSuperAdmin) {
      return NextResponse.json({ message: 'Akses ditolak' }, { status: 403 })
    }

    const body = await request.json()
    const rows: RekonRow[] = body.rows || []

    if (!rows.length) {
      return NextResponse.json({ message: 'Data rekon kosong' }, { status: 400 })
    }

    const results: RekonResult[] = []
    let updatedCount = 0
    let matchedCount = 0

    for (const row of rows) {
      const { refId, amount, fee, type, paymentChannel, paymentNo, status } = row

      const invoice = await prisma.invoice.findFirst({
        where: { OR: [{ id: refId }, { nomorInvoice: refId }] }
      })

      if (!invoice) {
        results.push({ refId, matched: false, updated: false, reason: 'Invoice tidak ditemukan' })
        continue
      }

      matchedCount++

      const isBerhasil = BERHASIL_STATUSES.includes((status || '').toLowerCase().trim())

      if (!isBerhasil) {
        await saveRekonFields(invoice.id, amount, fee, type, paymentChannel, paymentNo)
        results.push({
          refId, invoiceId: invoice.id, nomorInvoice: invoice.nomorInvoice,
          matched: true, updated: false, prevStatus: invoice.status,
          reason: `Status iPaymu bukan Berhasil: "${status}"`
        })
        continue
      }

      if (invoice.status === 'PAID') {
        await saveRekonFields(invoice.id, amount, fee, type, paymentChannel, paymentNo)
        results.push({
          refId, invoiceId: invoice.id, nomorInvoice: invoice.nomorInvoice,
          matched: true, updated: false, prevStatus: invoice.status,
          reason: 'Sudah PAID sebelumnya'
        })
        continue
      }

      // Update ke PAID + simpan rekon fields
      const catatanBaru = invoice.catatan
        ? `${invoice.catatan}\n[Rekon] ${paymentChannel} ${paymentNo}`
        : `[Rekon] ${paymentChannel} ${paymentNo}`

      const tanggalBayar = await markPaid(invoice.id, catatanBaru, amount, fee, type, paymentChannel, paymentNo)

      // Update periode paket company
      if (invoice.companyId && invoice.paketId) {
        const startDate = tanggalBayar
        const endDate = new Date(startDate)

        if (invoice.billingCycle === 'annually') {
          endDate.setFullYear(endDate.getFullYear() + 1)
        } else {
          endDate.setMonth(endDate.getMonth() + 1)
        }

        await prisma.company.update({
          where: { id: invoice.companyId },
          data: { paketId: invoice.paketId, paketStartDate: startDate, paketEndDate: endDate }
        })
      }

      updatedCount++
      results.push({
        refId, invoiceId: invoice.id, nomorInvoice: invoice.nomorInvoice,
        matched: true, updated: true, prevStatus: invoice.status
      })
    }

    return NextResponse.json({
      data: { total: rows.length, matched: matchedCount, updated: updatedCount, unmatched: rows.length - matchedCount, results },
      message: `Rekon selesai: ${updatedCount} invoice diupdate ke PAID dari ${matchedCount} yang cocok`
    })
  } catch (error) {
    console.error('Invoice rekon error:', error)

    return NextResponse.json({ message: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

export const POST = withAuth(handlePost)
