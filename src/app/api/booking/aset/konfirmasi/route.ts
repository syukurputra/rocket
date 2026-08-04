import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import prisma from '@/src/libs/prisma'
import { withAuth, type AuthContext } from '@/src/libs/auth-middleware'
import { buatPembayaranOrder, STATUS_TAGIHAN } from '@/src/libs/orderPayment'

const formatRupiah = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n)

/**
 * POST /api/booking/aset/konfirmasi  { tagihanId, setuju }
 *
 * Pemilik menyetujui atau menolak booking yang berstatus MENUNGGU KONFIRMASI.
 * Keputusan berlaku untuk seluruh tagihan dalam order yang sama, karena satu
 * order hanya punya satu pembayaran.
 *
 * - setuju  → status jadi BELUM TERBAYAR + link pembayaran iPaymu dibuat
 * - tolak   → status jadi DIBATALKAN
 */
async function handlePost(request: NextRequest, { user }: AuthContext) {
  try {
    if (!user.companyId) {
      return NextResponse.json({ message: 'User tidak terkait dengan perusahaan' }, { status: 400 })
    }

    const { tagihanId, setuju, alasan } = await request.json()

    if (!tagihanId || typeof setuju !== 'boolean') {
      return NextResponse.json({ message: 'tagihanId dan setuju wajib diisi' }, { status: 400 })
    }

    const alasanBatal = typeof alasan === 'string' ? alasan.trim() : ''

    if (!setuju && !alasanBatal) {
      return NextResponse.json({ message: 'Alasan pembatalan wajib diisi' }, { status: 400 })
    }

    const tagihan = await prisma.tagihan.findUnique({
      where: { id: tagihanId },
      include: {
        penyewa: { select: { id: true, nama: true, email: true, nomorTelepon: true } },
        aset: { select: { nama: true } },
        ruangan: { select: { nama: true } }
      }
    })

    if (!tagihan || tagihan.companyId !== user.companyId) {
      return NextResponse.json({ message: 'Booking tidak ditemukan' }, { status: 404 })
    }

    if (tagihan.status !== STATUS_TAGIHAN.menungguKonfirmasi) {
      return NextResponse.json({ message: 'Booking ini sudah dikonfirmasi sebelumnya' }, { status: 409 })
    }

    // Booking dari keranjang bisa terdiri dari beberapa tagihan sekaligus
    const targetOrder = tagihan.orderId ? { orderId: tagihan.orderId } : { id: tagihan.id }

    if (!setuju) {
      await prisma.tagihan.updateMany({
        where: { ...targetOrder, status: STATUS_TAGIHAN.menungguKonfirmasi },
        data: { status: STATUS_TAGIHAN.dibatalkan, alasanBatal, updatedById: user.id }
      })

      kirimNotifikasiPenyewa(tagihan, false, alasanBatal)

      return NextResponse.json({ data: { status: STATUS_TAGIHAN.dibatalkan }, message: 'Booking dibatalkan' })
    }

    await prisma.tagihan.updateMany({
      where: { ...targetOrder, status: STATUS_TAGIHAN.menungguKonfirmasi },
      data: { status: STATUS_TAGIHAN.belumTerbayar, updatedById: user.id }
    })

    // Link pembayaran baru dibuat sekarang, setelah booking disetujui
    let paymentUrl: string | null = null

    if (tagihan.orderId) {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || (request.headers.get('origin') ?? 'https://bantusewa.com')

      try {
        paymentUrl = await buatPembayaranOrder(tagihan.orderId, baseUrl)
      } catch (err) {
        console.error('[Konfirmasi Booking] iPaymu error:', err)

        // Status tetap disetujui — penyewa masih bisa membayar lewat tombol
        // "Bayar" yang membuat ulang link pembayaran.
      }
    }

    kirimNotifikasiPenyewa(tagihan, true)

    return NextResponse.json({
      data: { status: STATUS_TAGIHAN.belumTerbayar, paymentUrl },
      message: 'Booking disetujui, penyewa dapat melanjutkan pembayaran'
    })
  } catch (error) {
    console.error('Konfirmasi booking error:', error)

    return NextResponse.json({ message: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

/** Notifikasi in-app ke penyewa. Dijalankan tanpa menahan respons. */
function kirimNotifikasiPenyewa(
  tagihan: {
    id: string
    penyewaId: string
    nominal: unknown
    aset: { nama: string } | null
    ruangan: { nama: string } | null
  },
  disetujui: boolean,
  alasanBatal = ''
) {
  const rincian = `${tagihan.aset?.nama ?? '-'} ${tagihan.ruangan?.nama ?? ''} | ${formatRupiah(Number(tagihan.nominal))}`

  prisma.user
    .findUnique({ where: { id: tagihan.penyewaId }, select: { id: true } })
    .then(akun => {
      if (!akun) return

      return prisma.notifikasi.create({
        data: {
          title: disetujui ? 'Booking Disetujui' : 'Booking Ditolak',
          subtitle: disetujui
            ? `${rincian} — silakan lanjutkan pembayaran`
            : `${rincian} — dibatalkan: ${alasanBatal}`,
          avatarIcon: disetujui ? 'tabler-circle-check' : 'tabler-circle-x',
          avatarColor: disetujui ? 'success' : 'error',
          type: 'tagihan',
          url: `/booking/saya/${tagihan.id}`,
          refId: tagihan.id,
          userId: akun.id
        }
      })
    })
    .catch(err => console.error('[Konfirmasi Booking] Notifikasi penyewa error:', err))
}

export const POST = withAuth(handlePost)
