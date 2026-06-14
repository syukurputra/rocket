import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/src/libs/prisma'
import { sendInvoiceNotificationEmail } from '@/src/mails/invoiceNotificationEmail'

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || ''

    let status = ''
    let referenceId = ''
    let trxId = ''

    if (contentType.includes('application/json')) {
      const body = await request.json()

      status = body.status
      referenceId = body.reference_id
      trxId = String(body.trx_id || '')
    } else if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
      const formData = await request.formData()

      status = formData.get('status') as string
      referenceId = formData.get('reference_id') as string
      trxId = formData.get('trx_id') as string
    } else {
      // Fallback: coba baca sebagai text lalu parse
      const text = await request.text()

      try {
        const body = JSON.parse(text)

        status = body.status
        referenceId = body.reference_id
        trxId = String(body.trx_id || '')
      } catch {
        const params = new URLSearchParams(text)

        status = params.get('status') || ''
        referenceId = params.get('reference_id') || ''
        trxId = params.get('trx_id') || ''
      }
    }

    console.log(`[iPaymu Notify] status=${status} reference_id=${referenceId} trx_id=${trxId}`)

    if (!referenceId) {
      console.error('[iPaymu Notify] Missing reference_id')

      return new NextResponse('true', { status: 200 })
    }

    // Cari invoice berdasarkan nomorInvoice
    const invoice = await prisma.invoice.findUnique({
      where: { nomorInvoice: referenceId },
      include: {
        createdBy: { select: { id: true, email: true, username: true } },
        paket: { select: { nama: true } }
      }
    })

    if (!invoice) {
      console.error(`[iPaymu Notify] Invoice ${referenceId} tidak ditemukan`)

      return new NextResponse('true', { status: 200 })
    }

    // Map status iPaymu ke sistem
    let newStatus = invoice.status
    let tanggalBayar = invoice.tanggalBayar

    const statusLower = status?.toLowerCase() || ''

    if (statusLower === 'berhasil') {
      newStatus = 'PAID'
      tanggalBayar = new Date()
    } else if (statusLower === 'expired') {
      newStatus = 'EXPIRED'
    } else if (statusLower === 'gagal') {
      newStatus = 'CANCELLED'
    }

    if (newStatus !== invoice.status) {
      await prisma.invoice.update({
        where: { id: invoice.id },
        data: {
          status: newStatus,
          tanggalBayar,
          catatan: invoice.catatan
            ? `${invoice.catatan}\n[iPaymu] Trx ID: ${trxId} — ${status}`
            : `[iPaymu] Trx ID: ${trxId} — ${status}`
        }
      })

      console.log(`[iPaymu Notify] Invoice ${referenceId} updated → ${newStatus}`)

      // Update periode aktif company sesuai billingCycle invoice
      if (newStatus === 'PAID' && invoice.companyId && invoice.paketId) {
        const startDate = tanggalBayar ?? new Date()
        const endDate = new Date(startDate)

        if (invoice.billingCycle === 'annually') {
          endDate.setFullYear(endDate.getFullYear() + 1)
        } else {
          endDate.setMonth(endDate.getMonth() + 1)
        }

        await prisma.company.update({
          where: { id: invoice.companyId },
          data: {
            paketId: invoice.paketId,
            paketStartDate: startDate,
            paketEndDate: endDate
          }
        })

        console.log(`[iPaymu Notify] Company ${invoice.companyId} periode updated: ${startDate.toISOString()} → ${endDate.toISOString()}`)
      }

      // Buat notifikasi untuk user pembuat invoice
      if (invoice.createdBy?.id) {
        const notifMap: Record<string, { title: string; icon: string; color: string }> = {
          PAID:      { title: 'Pembayaran Invoice Berhasil', icon: 'tabler-circle-check', color: 'success' },
          EXPIRED:   { title: 'Invoice Kadaluarsa',          icon: 'tabler-clock-x',      color: 'warning' },
          CANCELLED: { title: 'Invoice Dibatalkan',          icon: 'tabler-circle-x',      color: 'error' }
        }

        const notif = notifMap[newStatus]

        if (notif) {
          await prisma.notifikasi.create({
            data: {
              title: notif.title,
              subtitle: `${referenceId} — Rp ${Number(invoice.total).toLocaleString('id-ID')}`,
              avatarIcon: notif.icon,
              avatarColor: notif.color,
              type: 'invoice',
              url: `/setting/invoice/preview/${invoice.id}`,
              refId: invoice.id,
              userId: invoice.createdBy.id
            }
          })

          // Kirim email notifikasi (non-blocking)
          const emailTo = invoice.createdBy.email
          if (emailTo && (newStatus === 'PAID' || newStatus === 'CANCELLED')) {
            sendInvoiceNotificationEmail(emailTo, newStatus as 'PAID' | 'CANCELLED', {
              nomorInvoice: referenceId,
              userName: invoice.createdBy.username || emailTo,
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
                console.log(`[iPaymu Notify] Email ${newStatus} sent to:`, emailTo)
              } else {
                console.error('[iPaymu Notify] Failed to send email:', result.error)
              }
            }).catch(err => console.error('[iPaymu Notify] Email error:', err))
          }
        }
      }
    }

    // iPaymu mengharapkan response 'true'
    return new NextResponse('true', { status: 200 })
  } catch (error) {
    console.error('[iPaymu Notify] Error:', error)

    // Tetap return true agar iPaymu tidak retry terus
    return new NextResponse('true', { status: 200 })
  }
}
