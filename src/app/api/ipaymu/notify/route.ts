import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/src/libs/prisma'
import { sendInvoiceNotificationEmail } from '@/src/mails/invoiceNotificationEmail'

// iPaymu mengirim status dalam berbagai format — normalize ke lowercase
const parseIpaymuStatus = (raw: string): 'berhasil' | 'gagal' | 'expired' | 'pending' | 'unknown' => {
  const s = (raw || '').toLowerCase().trim()

  if (['berhasil', 'success', 'paid', 'settlement'].includes(s)) return 'berhasil'
  if (['gagal', 'failed', 'failure', 'cancelled', 'cancel'].includes(s)) return 'gagal'
  if (['expired', 'expire'].includes(s)) return 'expired'
  if (['pending', 'waiting'].includes(s)) return 'pending'

  return 'unknown'
}

// Parse payload dari berbagai content-type iPaymu
async function parsePayload(request: NextRequest): Promise<Record<string, string>> {
  const contentType = request.headers.get('content-type') || ''

  try {
    if (contentType.includes('application/json')) {
      return await request.json()
    }

    if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
      const formData = await request.formData()
      const result: Record<string, string> = {}

      formData.forEach((val, key) => { result[key] = String(val) })

      return result
    }

    // Fallback: baca sebagai raw text
    const text = await request.text()

    try {
      return JSON.parse(text)
    } catch {
      const result: Record<string, string> = {}

      new URLSearchParams(text).forEach((val, key) => { result[key] = val })

      return result
    }
  } catch (err) {
    console.error('[iPaymu Notify] Failed to parse payload:', err)

    return {}
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = await parsePayload(request)

    // iPaymu mengirim beberapa kemungkinan field name
    const rawStatus = payload.status || payload.Status || ''
    const referenceId = payload.reference_id || payload.referenceId || payload.ReferenceId || ''
    const trxId = payload.trx_id || payload.trxId || payload.TrxId || ''

    console.log('[iPaymu Notify] Payload masuk:', JSON.stringify(payload))
    console.log(`[iPaymu Notify] status="${rawStatus}" reference_id="${referenceId}" trx_id="${trxId}"`)

    if (!referenceId) {
      console.error('[iPaymu Notify] reference_id kosong, abaikan')

      return new NextResponse('true', { status: 200 })
    }

    const ipaymuStatus = parseIpaymuStatus(rawStatus)

    console.log(`[iPaymu Notify] normalized status="${ipaymuStatus}"`)

    // ─── TAGIHAN BOOKING (prefix BKG-) ────────────────────────────────────────
    if (referenceId.startsWith('BKG-')) {
      const tagihanId = referenceId.slice(4) // hapus prefix "BKG-"

      console.log(`[iPaymu Notify] Tipe: TAGIHAN — tagihanId="${tagihanId}"`)

      const tagihan = await prisma.tagihan.findUnique({
        where: { id: tagihanId },
        include: {
          penyewa: { select: { id: true, nama: true, email: true } },
          createdBy: { select: { id: true } }
        }
      })

      if (!tagihan) {
        console.error(`[iPaymu Notify] Tagihan "${tagihanId}" tidak ditemukan`)

        return new NextResponse('true', { status: 200 })
      }

      console.log(`[iPaymu Notify] Tagihan ditemukan: status saat ini="${tagihan.status}"`)

      if (ipaymuStatus === 'berhasil' && tagihan.status !== 'LUNAS') {
        await prisma.tagihan.update({
          where: { id: tagihanId },
          data: {
            status: 'LUNAS',
            metodeBayar: 'ipaymu',
            updatedById: tagihan.createdById
          }
        })

        console.log(`[iPaymu Notify] Tagihan "${tagihanId}" → LUNAS ✓`)
      } else if (ipaymuStatus === 'expired' || ipaymuStatus === 'gagal') {
        console.log(`[iPaymu Notify] Tagihan "${tagihanId}" payment ${ipaymuStatus} — tidak diubah`)
      } else {
        console.log(`[iPaymu Notify] Tagihan "${tagihanId}" status "${ipaymuStatus}" — tidak ada aksi`)
      }

      return new NextResponse('true', { status: 200 })
    }

    // ─── INVOICE PAKET (prefix INV-) ──────────────────────────────────────────
    console.log(`[iPaymu Notify] Tipe: INVOICE — referenceId="${referenceId}"`)

    const invoice = await prisma.invoice.findUnique({
      where: { nomorInvoice: referenceId },
      include: {
        createdBy: { select: { id: true, email: true, username: true } },
        paket: { select: { nama: true } }
      }
    })

    if (!invoice) {
      console.error(`[iPaymu Notify] Invoice "${referenceId}" tidak ditemukan`)

      return new NextResponse('true', { status: 200 })
    }

    console.log(`[iPaymu Notify] Invoice ditemukan: status saat ini="${invoice.status}"`)

    let newStatus = invoice.status
    let tanggalBayar = invoice.tanggalBayar

    if (ipaymuStatus === 'berhasil') {
      newStatus = 'PAID'
      tanggalBayar = new Date()
    } else if (ipaymuStatus === 'expired') {
      newStatus = 'EXPIRED'
    } else if (ipaymuStatus === 'gagal') {
      newStatus = 'CANCELLED'
    }

    if (newStatus !== invoice.status) {
      await prisma.invoice.update({
        where: { id: invoice.id },
        data: {
          status: newStatus,
          tanggalBayar,
          catatan: invoice.catatan
            ? `${invoice.catatan}\n[iPaymu] Trx ID: ${trxId} — ${rawStatus}`
            : `[iPaymu] Trx ID: ${trxId} — ${rawStatus}`
        }
      })

      console.log(`[iPaymu Notify] Invoice "${referenceId}" → ${newStatus} ✓`)

      // Update periode aktif company
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
          data: { paketId: invoice.paketId, paketStartDate: startDate, paketEndDate: endDate }
        })

        console.log(`[iPaymu Notify] Company "${invoice.companyId}" periode updated ✓`)
      }

      // Notifikasi & email
      if (invoice.createdBy?.id) {
        const notifMap: Record<string, { title: string; icon: string; color: string }> = {
          PAID:      { title: 'Pembayaran Invoice Berhasil', icon: 'tabler-circle-check', color: 'success' },
          EXPIRED:   { title: 'Invoice Kadaluarsa',          icon: 'tabler-clock-x',      color: 'warning' },
          CANCELLED: { title: 'Invoice Dibatalkan',          icon: 'tabler-circle-x',      color: 'error' }
        }

        const notif = notifMap[newStatus]

        if (notif) {
          prisma.notifikasi.create({
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
          }).catch(err => console.error('[iPaymu Notify] Notifikasi error:', err))

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
            }).catch(err => console.error('[iPaymu Notify] Email error:', err))
          }
        }
      }
    }

    return new NextResponse('true', { status: 200 })
  } catch (error) {
    console.error('[iPaymu Notify] Unhandled error:', error)

    return new NextResponse('true', { status: 200 })
  }
}
