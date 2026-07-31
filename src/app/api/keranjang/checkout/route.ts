import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import prisma from '@/src/libs/prisma'
import { withAuth, type AuthContext } from '@/src/libs/auth-middleware'
import { createIpaymuPayment } from '@/src/libs/ipaymu'
import { getTarifBiayaLayanan } from '@/src/libs/getBiayaLayanan'
import { hitungBiayaLayanan } from '@/src/libs/biayaLayanan'
import { generateNomorTagihan } from '@/src/libs/nomorTagihan'
import { isAlamatLengkap } from '@/src/libs/alamatPemesan'

const JENIS_PERIODE: Record<string, string> = {
  JAM: 'jam',
  HARIAN: 'harian',
  BULANAN: 'bulanan',
  TAHUNAN: 'tahunan'
}

const formatRupiah = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n)

/**
 * POST /api/keranjang/checkout
 *
 * Mengubah seluruh isi keranjang jadi tagihan (satu tagihan per item) yang
 * berbagi satu `orderId`, lalu membuat SATU link pembayaran iPaymu untuk
 * seluruh order. Keranjang dikosongkan setelah link berhasil dibuat.
 */
async function handlePost(request: NextRequest, { user }: AuthContext) {
  try {
    const body = await request.json().catch(() => ({}))
    const { namaPemesan, email, telepon } = body

    const items = await prisma.keranjang.findMany({
      where: { userId: user.id },
      include: {
        aset: { select: { id: true, nama: true, alamatPemesanAktif: true } },
        itemAset: { select: { id: true, nama: true, multipleBooking: true } }
      },
      orderBy: { createdAt: 'asc' }
    })

    if (items.length === 0) {
      return NextResponse.json({ message: 'Keranjang masih kosong' }, { status: 400 })
    }

    // Dijaga sejak penambahan ke keranjang, dicek ulang di sini sebagai pengaman
    const asetId = items[0].asetId
    const companyId = items[0].companyId

    if (items.some(i => i.asetId !== asetId)) {
      return NextResponse.json(
        { message: 'Keranjang berisi lebih dari satu aset. Sisakan satu aset saja lalu coba lagi.' },
        { status: 400 }
      )
    }

    const nama = namaPemesan || user.name || user.username
    const emailPemesan = email || user.email || ''
    const nomorTelepon = telepon || ''

    if (!nomorTelepon) {
      return NextResponse.json({ message: 'Nomor telepon harus diisi' }, { status: 400 })
    }

    // Aset yang mengaktifkan "Alamat Pemesan" mensyaratkan alamat profil lengkap
    if (items.some(i => i.aset?.alamatPemesanAktif)) {
      const profil = await prisma.user.findUnique({
        where: { id: user.id },
        select: { alamat: true, provinsi: true, kota: true, kecamatan: true, kelurahan: true }
      })

      if (!isAlamatLengkap(profil)) {
        return NextResponse.json(
          { message: 'Harus lengkapi alamat terlebih dahulu', code: 'ALAMAT_BELUM_LENGKAP' },
          { status: 400 }
        )
      }
    }

    // Tanggal bisa saja keburu dibayar orang lain setelah masuk keranjang.
    // Item multiple booking dikecualikan karena boleh dipesan bersamaan.
    for (const item of items) {
      if (item.itemAset?.multipleBooking) continue

      const konflik = await prisma.tagihan.findFirst({
        where: {
          itemAsetId: item.itemAsetId,
          status: 'LUNAS',
          AND: [{ mulaiSewa: { lte: item.selesaiSewa } }, { selesaiSewa: { gte: item.mulaiSewa } }]
        }
      })

      if (konflik) {
        return NextResponse.json(
          {
            message: `Jadwal "${item.itemAset?.nama}" sudah dibooking orang lain. Hapus item tersebut dari keranjang lalu coba lagi.`,
            code: 'JADWAL_TERPAKAI',
            keranjangId: item.id
          },
          { status: 409 }
        )
      }
    }

    // Semua record dicatat atas nama user pertama company pemilik aset,
    // mengikuti pola booking publik yang sudah ada.
    const companyUser = await prisma.user.findFirst({
      where: { companyId },
      orderBy: { createdAt: 'asc' }
    })

    if (!companyUser) {
      return NextResponse.json({ message: 'Company tidak valid' }, { status: 400 })
    }

    // Penyewa dipakai ulang kalau user ini sudah pernah booking di company sama
    const existingPenyewa = await prisma.penyewa.findFirst({ where: { id: user.id, companyId } })

    const penyewa = existingPenyewa
      ? await prisma.penyewa.update({
          where: { id: existingPenyewa.id },
          data: {
            nama,
            email: emailPemesan || existingPenyewa.email,
            nomorTelepon: nomorTelepon || existingPenyewa.nomorTelepon
          }
        })
      : await prisma.penyewa.create({
          data: {
            id: user.id,
            nama,
            email: emailPemesan || null,
            nomorTelepon,
            status: 'booking',
            companyId,
            createdById: companyUser.id,
            updatedById: companyUser.id
          }
        })

    const tarif = await getTarifBiayaLayanan()
    const orderId = `ORD-${Date.now().toString(36).toUpperCase()}-${user.id.slice(-6).toUpperCase()}`

    const tagihanIds: string[] = []
    const produk: string[] = []
    const qty: string[] = []
    const harga: string[] = []

    let totalBayar = 0

    for (const item of items) {
      // nominal = yang dibayar pemesan. Biaya layanan tidak ditambahkan di atasnya,
      // melainkan dipotong dari nominal itu sebagai bagian platform.
      const total = Number(item.total)
      const adminBooking = hitungBiayaLayanan(total, tarif)
      const periodeSewa = JENIS_PERIODE[item.jenisHarga] || item.jenisHarga

      const keterangan = item.catatan
        ? `Booking ${item.aset?.nama} - ${item.itemAset?.nama} (${periodeSewa} x${item.durasi}). ${item.catatan}`
        : `Booking ${item.aset?.nama} - ${item.itemAset?.nama} (${periodeSewa} x${item.durasi})`

      const nomorTagihan = await generateNomorTagihan()

      const tagihan = await prisma.tagihan.create({
        data: {
          nomorTagihan,
          keterangan,
          status: 'BELUM TERBAYAR',
          periodeSewa,
          mulaiSewa: item.mulaiSewa,
          selesaiSewa: item.selesaiSewa,
          nominal: total,
          adminBooking,
          hargaMerchant: Math.max(0, total - adminBooking),
          orderId,
          penyewaId: penyewa.id,
          asetId: item.asetId,
          itemAsetId: item.itemAsetId,
          companyId,
          createdById: companyUser.id,
          updatedById: companyUser.id
        }
      })

      tagihanIds.push(tagihan.id)
      produk.push(keterangan)
      qty.push('1')
      harga.push(String(total))

      totalBayar += total
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || (request.headers.get('origin') ?? 'https://bantusewa.com')

    let paymentUrl: string

    try {
      const ipaymuResult = await createIpaymuPayment({
        transactionId: orderId,
        amount: totalBayar,
        buyerName: nama,
        buyerEmail: emailPemesan || 'customer@example.com',
        buyerPhone: nomorTelepon,
        product: produk,
        qty,
        price: harga,
        description: produk,
        returnUrl: `${baseUrl}/booking/saya`,
        cancelUrl: `${baseUrl}/booking/saya`,
        notifyUrl: `${baseUrl}/api/ipaymu/notify`
      })

      paymentUrl = ipaymuResult.Data.Url

      await prisma.tagihan.updateMany({
        where: { id: { in: tagihanIds } },
        data: { paymentUrl, ipaymuSessionId: ipaymuResult.Data.SessionID }
      })
    } catch (err) {
      console.error('[Keranjang Checkout] iPaymu error:', err)

      // Tagihan yang terlanjur dibuat dibatalkan supaya keranjang tidak berubah
      // jadi tagihan menggantung tanpa cara bayar.
      await prisma.tagihan.deleteMany({ where: { id: { in: tagihanIds } } })

      return NextResponse.json(
        { message: 'Gagal membuat link pembayaran. Coba beberapa saat lagi.' },
        { status: 502 }
      )
    }

    // Link pembayaran sudah ada → keranjang boleh dikosongkan
    await prisma.keranjang.deleteMany({ where: { userId: user.id } })

    const ringkasan = `${items.length} booking ${items[0].aset?.nama} | ${formatRupiah(totalBayar)}`

    prisma.notifikasi
      .create({
        data: {
          title: 'Booking Menunggu Pembayaran',
          subtitle: `${orderId} — ${ringkasan}`,
          avatarIcon: 'tabler-shopping-cart',
          avatarColor: 'primary',
          type: 'tagihan',
          url: '/booking/saya',
          refId: orderId,
          userId: user.id
        }
      })
      .catch(err => console.error('[Keranjang Checkout] Notifikasi penyewa error:', err))

    prisma.user
      .findMany({
        where: { companyId, role: { nama: { equals: 'Super Admin', mode: 'insensitive' } } },
        select: { id: true }
      })
      .then(superAdmins => {
        if (!superAdmins.length) return

        return prisma.notifikasi.createMany({
          data: superAdmins.map(u => ({
            title: 'Booking Baru Masuk',
            subtitle: `${nama} — ${ringkasan}`,
            avatarIcon: 'tabler-calendar-plus',
            avatarColor: 'warning',
            type: 'tagihan',
            url: '/booking',
            refId: orderId,
            userId: u.id
          }))
        })
      })
      .catch(err => console.error('[Keranjang Checkout] Notifikasi super admin error:', err))

    return NextResponse.json(
      {
        data: { orderId, paymentUrl, jumlahTagihan: tagihanIds.length, totalBayar },
        message: 'Link pembayaran berhasil dibuat'
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Checkout keranjang error:', error)

    return NextResponse.json({ message: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

export const POST = withAuth(handlePost)
