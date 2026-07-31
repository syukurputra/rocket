import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import prisma from '@/src/libs/prisma'
import { withAuth, type AuthContext } from '@/src/libs/auth-middleware'
import { buatPembayaranOrder, STATUS_TAGIHAN } from '@/src/libs/orderPayment'
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
        itemAset: { select: { id: true, nama: true, multipleBooking: true, konfirmasiBooking: true } }
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

    // Satu order = satu pembayaran, jadi kalau ada satu saja item yang butuh
    // persetujuan pemilik, seluruh order menunggu konfirmasi dulu.
    const perluKonfirmasi = items.some(i => i.itemAset?.konfirmasiBooking)

    const tagihanIds: string[] = []

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
          status: perluKonfirmasi ? STATUS_TAGIHAN.menungguKonfirmasi : STATUS_TAGIHAN.belumTerbayar,
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
      totalBayar += total
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || (request.headers.get('origin') ?? 'https://bantusewa.com')

    // Booking yang perlu konfirmasi belum boleh dibayar — link pembayarannya
    // baru dibuat setelah pemilik menyetujui.
    let paymentUrl: string | null = null

    if (!perluKonfirmasi) {
      try {
        paymentUrl = await buatPembayaranOrder(orderId, baseUrl, {
          nama,
          email: emailPemesan,
          telepon: nomorTelepon
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
    }

    // Order sudah terbentuk → keranjang boleh dikosongkan
    await prisma.keranjang.deleteMany({ where: { userId: user.id } })

    const ringkasan = `${items.length} booking ${items[0].aset?.nama} | ${formatRupiah(totalBayar)}`

    prisma.notifikasi
      .create({
        data: {
          title: perluKonfirmasi ? 'Booking Menunggu Konfirmasi' : 'Booking Menunggu Pembayaran',
          subtitle: `${orderId} — ${ringkasan}`,
          avatarIcon: perluKonfirmasi ? 'tabler-clock-hour-4' : 'tabler-shopping-cart',
          avatarColor: perluKonfirmasi ? 'warning' : 'primary',
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
            title: perluKonfirmasi ? 'Booking Perlu Konfirmasi' : 'Booking Baru Masuk',
            subtitle: `${nama} — ${ringkasan}`,
            avatarIcon: perluKonfirmasi ? 'tabler-help-circle' : 'tabler-calendar-plus',
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
        data: { orderId, paymentUrl, perluKonfirmasi, jumlahTagihan: tagihanIds.length, totalBayar },
        message: perluKonfirmasi
          ? 'Booking dikirim dan menunggu konfirmasi pemilik'
          : 'Link pembayaran berhasil dibuat'
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Checkout keranjang error:', error)

    return NextResponse.json({ message: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

export const POST = withAuth(handlePost)
