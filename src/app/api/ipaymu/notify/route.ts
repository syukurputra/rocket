import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/src/libs/prisma'
import { sendInvoiceNotificationEmail } from '@/src/mails/invoiceNotificationEmail'
import { sendPaymentConfirmationEmail } from '@/src/mails/paymentConfirmationEmail'
import { sendBookingPaymentOwnerEmail } from '@/src/mails/bookingPaymentOwnerEmail'
import { createPendapatan } from '@/src/libs/pendapatanService'
import { createKeuanganBooking } from '@/src/libs/keuanganBookingService'

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

    // ─── Cari tagihan dulu by ID, lalu invoice ───────────────────────────────
    const tagihan = await prisma.tagihan.findUnique({
      where: { id: referenceId },
        include: {
          penyewa: { select: { id: true, nama: true, email: true } },
          aset: { select: { nama: true } },
          ruangan: { select: { nama: true } },
          createdBy: { select: { id: true } }
        }
      })

    if (tagihan) {
      const tagihanId = tagihan.id

      console.log(`[iPaymu Notify] Tipe: TAGIHAN — tagihanId="${tagihanId}" status="${tagihan.status}"`)

      if (ipaymuStatus === 'berhasil' && tagihan.status !== 'LUNAS') {
        await prisma.tagihan.update({
          where: { id: tagihanId },
          data: {
            status: 'LUNAS',
            metodeBayar: 'ipaymu',
            updatedById: tagihan.createdById
          }
        })

        // Set tanggal pembayaran (kolom baru, Prisma Client belum di-regenerate)
        await prisma.$executeRaw`UPDATE "tagihan" SET "tanggalBayar" = NOW() WHERE id = ${tagihanId}`

        console.log(`[iPaymu Notify] Tagihan "${tagihanId}" → LUNAS ✓`)

        // Catat pendapatan + keuangan (booking, kategori "BOOKING").
        // createKeuanganBooking hanya dijalankan kalau createPendapatan BENAR-BENAR
        // baru dibuat (bukan sudah ada) — jadi aman kalau webhook iPaymu terkirim ulang.
        if (tagihan.companyId) {
          createPendapatan(tagihanId, tagihan.companyId, Number(tagihan.nominal))
            .then(created => {
              if (created) return createKeuanganBooking(tagihan)
            })
            .catch(err => console.error('[iPaymu Notify] Pendapatan/Keuangan error:', err))
        }

        const nomorTagihanRows = await prisma.$queryRaw<{ nomorTagihan: string | null }[]>`
          SELECT "nomorTagihan" FROM "tagihan" WHERE id = ${tagihanId}
        `
        const nomorBooking = nomorTagihanRows[0]?.nomorTagihan || `BK-${tagihanId.slice(-8).toUpperCase()}`

        const nominalFmt = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(Number(tagihan.nominal))

        // Email konfirmasi ke penyewa (yang booking)
        if (tagihan.penyewa?.email) {
          sendPaymentConfirmationEmail(
            tagihan.penyewa.email,
            tagihan.penyewa.nama,
            tagihan.keterangan || `${tagihan.aset?.nama} — ${tagihan.ruangan?.nama}`,
            tagihan.mulaiSewa.toISOString(),
            tagihan.selesaiSewa.toISOString(),
            Number(tagihan.nominal),
            'ipaymu',
            nomorBooking
          ).catch(err => console.error('[iPaymu Notify] Email penyewa error:', err))
        }

        // Notifikasi ke penyewa (jika punya akun user — penyewa.id = userId saat booking login)
        if (tagihan.penyewaId) {
          prisma.user.findUnique({ where: { id: tagihan.penyewaId }, select: { id: true } })
            .then(userPenyewa => {
              if (!userPenyewa) return
              return prisma.notifikasi.create({
                data: {
                  title: 'Pembayaran Booking Berhasil',
                  subtitle: `${nomorBooking} — ${tagihan.aset?.nama} ${tagihan.ruangan?.nama} | ${nominalFmt}`,
                  avatarIcon: 'tabler-circle-check',
                  avatarColor: 'success',
                  type: 'tagihan',
                  url: '/booking',
                  refId: tagihanId,
                  userId: userPenyewa.id
                }
              })
            }).catch(err => console.error('[iPaymu Notify] Notifikasi penyewa error:', err))
        }

        // Email + notifikasi ke semua Super Admin company (pemilik sewaan)
        if (tagihan.companyId) {
          prisma.user.findMany({
            where: {
              companyId: tagihan.companyId,
              role: { nama: { equals: 'Super Admin', mode: 'insensitive' } }
            },
            select: { id: true, email: true }
          }).then(superAdmins => {
            if (!superAdmins.length) return
            // Kirim email ke setiap Super Admin
            superAdmins.forEach(admin => {
              if (admin.email) {
                sendBookingPaymentOwnerEmail(admin.email, {
                  nomorBooking,
                  namaPemesan: tagihan.penyewa?.nama || '-',
                  namaAset: tagihan.aset?.nama || '-',
                  namaItemAset: tagihan.ruangan?.nama || '-',
                  periodeSewa: tagihan.periodeSewa || '-',
                  mulaiSewa: tagihan.mulaiSewa.toISOString(),
                  selesaiSewa: tagihan.selesaiSewa.toISOString(),
                  total: Number(tagihan.nominal)
                }).catch(err => console.error('[iPaymu Notify] Email owner error:', err))
              }
            })
            // Buat notifikasi untuk setiap Super Admin
            return prisma.notifikasi.createMany({
              data: superAdmins.map(u => ({
                title: 'Pembayaran Booking Berhasil',
                subtitle: `${tagihan.penyewa?.nama || '-'} — ${nomorBooking} | ${nominalFmt}`,
                avatarIcon: 'tabler-circle-check',
                avatarColor: 'success',
                type: 'tagihan',
                url: `/penyewa/edit/${tagihan.penyewaId}`,
                refId: tagihanId,
                userId: u.id
              }))
            })
          }).catch(err => console.error('[iPaymu Notify] Super admin notif error:', err))
        }
      } else {
        console.log(`[iPaymu Notify] Tagihan "${tagihanId}" status "${ipaymuStatus}" — tidak ada aksi`)
      }

      return new NextResponse('true', { status: 200 })
    }

    // ─── INVOICE PAKET (invoice.id sebagai referenceId) ───────────────────────
    console.log(`[iPaymu Notify] Tipe: INVOICE — referenceId="${referenceId}"`)

    const invoice = await prisma.invoice.findUnique({
      where: { id: referenceId },
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
              subtitle: `${invoice.nomorInvoice || referenceId} — Rp ${Number(invoice.total).toLocaleString('id-ID')}`,
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
              nomorInvoice: invoice.nomorInvoice || referenceId,
              userName: invoice.createdBy.username || emailTo,
              paketName: invoice.paket?.nama || '-',
              billingCycle: invoice.billingCycle,
              subtotal: Number(invoice.subtotal),
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
