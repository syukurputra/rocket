// src/libs/orderPayment.ts
//
// Satu order booking bisa berisi beberapa tagihan yang berbagi `orderId`, tapi
// pembayarannya hanya satu link iPaymu. Logikanya dipakai dua kali: saat
// checkout keranjang, dan saat pemilik menyetujui booking yang perlu konfirmasi.

import prisma from './prisma'
import { createIpaymuPayment } from './ipaymu'

/** Status tagihan yang dipakai di alur booking. */
export const STATUS_TAGIHAN = {
  menungguKonfirmasi: 'MENUNGGU KONFIRMASI',
  belumTerbayar: 'BELUM TERBAYAR',
  dibatalkan: 'DIBATALKAN',
  lunas: 'LUNAS'
} as const

type PembeliOrder = {
  nama: string
  email: string
  telepon: string
}

/**
 * Buat satu link pembayaran iPaymu untuk seluruh tagihan dalam sebuah order,
 * lalu simpan link & session-nya ke tiap tagihan.
 *
 * @returns URL pembayaran
 * @throws kalau order kosong atau iPaymu menolak
 */
export async function buatPembayaranOrder(orderId: string, baseUrl: string, pembeli?: PembeliOrder): Promise<string> {
  const daftar = await prisma.tagihan.findMany({
    where: { orderId },
    include: { penyewa: { select: { nama: true, email: true, nomorTelepon: true } } },
    orderBy: { createdAt: 'asc' }
  })

  if (daftar.length === 0) {
    throw new Error(`Order "${orderId}" tidak punya tagihan`)
  }

  const produk = daftar.map(t => t.keterangan)
  const qty = daftar.map(() => '1')
  const harga = daftar.map(t => String(Number(t.nominal)))
  const totalBayar = daftar.reduce((sum, t) => sum + Number(t.nominal), 0)

  const penyewa = daftar[0].penyewa

  const hasil = await createIpaymuPayment({
    transactionId: orderId,
    amount: totalBayar,
    buyerName: pembeli?.nama || penyewa?.nama || 'Customer',
    buyerEmail: pembeli?.email || penyewa?.email || 'customer@example.com',
    buyerPhone: pembeli?.telepon || penyewa?.nomorTelepon || '081234567890',
    product: produk,
    qty,
    price: harga,
    description: produk,
    returnUrl: `${baseUrl}/booking/saya`,
    cancelUrl: `${baseUrl}/booking/saya`,
    notifyUrl: `${baseUrl}/api/ipaymu/notify`
  })

  await prisma.tagihan.updateMany({
    where: { orderId },
    data: { paymentUrl: hasil.Data.Url, ipaymuSessionId: hasil.Data.SessionID }
  })

  return hasil.Data.Url
}
