import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import prisma from '@/src/libs/prisma'
import { sendBookingCreatedEmail } from '@/src/mails/bookingCreatedEmail'
import { createIpaymuPayment } from '@/src/libs/ipaymu'
import { getBiayaLayanan } from '@/src/libs/getBiayaLayanan'
import { generateNomorTagihan } from '@/src/libs/nomorTagihan'

const JENIS_PERIODE: Record<string, string> = {
  JAM: 'jam',
  HARIAN: 'harian',
  BULANAN: 'bulanan',
  TAHUNAN: 'tahunan'
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { ruanganId, namaPemesan, email, telepon, jenisHarga, mulaiSewa, selesaiSewa, durasi, hargaSatuan, total, catatan, userId } = body

    if (!ruanganId || !namaPemesan || !telepon || !jenisHarga || !mulaiSewa || !selesaiSewa || !durasi) {
      return NextResponse.json({ message: 'Data tidak lengkap' }, { status: 400 })
    }

    const ruangan = await prisma.ruangan.findUnique({
      where: { id: ruanganId },
      include: { aset: true }
    })

    if (!ruangan) {
      return NextResponse.json({ message: 'Item Aset tidak ditemukan' }, { status: 404 })
    }

    // Find company's first user to use as createdById for records
    const companyUser = await prisma.user.findFirst({
      where: { companyId: ruangan.companyId },
      orderBy: { createdAt: 'asc' }
    })

    if (!companyUser) {
      return NextResponse.json({ message: 'Company tidak valid' }, { status: 400 })
    }

    // Biaya layanan mengikuti jenjang total booking. Dihitung ulang di server —
    // nilai adminBooking dari client sengaja diabaikan.
    const adminBooking = await getBiayaLayanan(Number(total))

    const mulaiSewaDate = new Date(mulaiSewa)
    const selesaiSewaDate = new Date(selesaiSewa)
    const periodeSewa = JENIS_PERIODE[jenisHarga] || jenisHarga

    // Cek konflik tanggal pada ruangan yang sama dengan status LUNAS
    const konflik = await prisma.tagihan.findFirst({
      where: {
        itemAsetId: ruanganId,
        status: 'LUNAS',
        AND: [
          { mulaiSewa: { lte: selesaiSewaDate } },
          { selesaiSewa: { gte: mulaiSewaDate } }
        ]
      }
    })
    if (konflik) {
      return NextResponse.json({ message: 'Tanggal yang dipilih tidak tersedia' }, { status: 409 })
    }

    let penyewa

    if (userId) {
      // User sedang login: cek apakah sudah ada penyewa dengan userId ini di company ini
      const existingPenyewa = await prisma.penyewa.findFirst({
        where: { id: userId, companyId: ruangan.companyId }
      })

      if (existingPenyewa) {
        // Sudah ada penyewa → update nama jika ada perubahan
        penyewa = await prisma.penyewa.update({
          where: { id: existingPenyewa.id },
          data: { nama: namaPemesan, email: email || existingPenyewa.email, nomorTelepon: telepon || existingPenyewa.nomorTelepon }
        })
      } else {
        // Belum ada → buat penyewa baru dengan id = userId
        penyewa = await prisma.penyewa.create({
          data: {
            id: userId,
            nama: namaPemesan,
            email: email || null,
            nomorTelepon: telepon,
            status: 'booking',
            companyId: ruangan.companyId,
            createdById: companyUser.id,
            updatedById: companyUser.id
          }
        })
      }
    } else {
      // Tidak login → generate id otomatis (cuid default)
      penyewa = await prisma.penyewa.create({
        data: {
          nama: namaPemesan,
          email: email || null,
          nomorTelepon: telepon,
          status: 'booking',
          companyId: ruangan.companyId,
          createdById: companyUser.id,
          updatedById: companyUser.id
        }
      })
    }

    // Create Tagihan linked to Penyewa
    const keterangan = catatan
      ? `Booking ${ruangan.aset.nama} - ${ruangan.nama} (${periodeSewa} x${durasi}). ${catatan}`
      : `Booking ${ruangan.aset.nama} - ${ruangan.nama} (${periodeSewa} x${durasi})`

    const tagihan = await prisma.tagihan.create({
      data: {
        keterangan,
        status: 'BELUM TERBAYAR',
        periodeSewa,
        mulaiSewa: mulaiSewaDate,
        selesaiSewa: selesaiSewaDate,
        nominal: Number(total),
        penyewaId: penyewa.id,
        asetId: ruangan.asetId,
        itemAsetId: ruanganId,
        companyId: ruangan.companyId,
        createdById: companyUser.id,
        updatedById: companyUser.id
      }
    })

    const hargaMerchant = Math.max(0, Number(total) - adminBooking)
    const nomorTagihan = await generateNomorTagihan()
    await prisma.$executeRaw`UPDATE "tagihan" SET "adminBooking" = ${adminBooking}, "hargaMerchant" = ${hargaMerchant}, "nomorTagihan" = ${nomorTagihan} WHERE id = ${tagihan.id}`

    const nomorBooking = nomorTagihan

    // Generate iPaymu payment URL
    let paymentUrl: string | null = null
    try {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://bantusewa.com'
      const referenceId = `BKG-${tagihan.id}`
      const ipaymuResult = await createIpaymuPayment({
        transactionId: referenceId,
        amount: Number(total) + adminBooking,
        buyerName: namaPemesan,
        buyerEmail: email || 'customer@example.com',
        buyerPhone: telepon,
        product: [keterangan],
        qty: ['1'],
        price: [String(Number(total))],
        description: [keterangan],
        returnUrl: `${baseUrl}/booking/saya`,
        cancelUrl: `${baseUrl}/booking/saya`,
        notifyUrl: `${baseUrl}/api/ipaymu/notify`
      })
      paymentUrl = ipaymuResult.Data.Url
      // Simpan ke tagihan
      await prisma.tagihan.update({
        where: { id: tagihan.id },
        data: { paymentUrl, ipaymuSessionId: ipaymuResult.Data.SessionID }
      })
    } catch (err) {
      console.error('[Booking] iPaymu payment URL error:', err)
    }

    // Email ke penyewa
    if (email) {
      sendBookingCreatedEmail(email, {
        nomorBooking,
        namaPemesan,
        namaAset: ruangan.aset.nama,
        namaItemAset: ruangan.nama,
        periodeSewa,
        mulaiSewa: mulaiSewaDate.toISOString(),
        selesaiSewa: selesaiSewaDate.toISOString(),
        total: Number(total),
        paymentUrl: paymentUrl || undefined
      }).catch(err => console.error('[Booking] Email error:', err))
    }

    // Notifikasi ke penyewa (jika login)
    if (userId) {
      prisma.notifikasi.create({
        data: {
          title: 'Booking Berhasil Dibuat',
          subtitle: `${nomorBooking} — ${ruangan.aset.nama} ${ruangan.nama} | Menunggu Pembayaran`,
          avatarIcon: 'tabler-calendar-check',
          avatarColor: 'primary',
          type: 'tagihan',
          url: '/booking',
          refId: tagihan.id,
          userId
        }
      }).catch(err => console.error('[Booking] Notifikasi penyewa error:', err))
    }

    // Notifikasi ke semua Super Admin company
    prisma.user.findMany({
      where: {
        companyId: ruangan.companyId,
        role: { nama: { equals: 'Super Admin', mode: 'insensitive' } }
      },
      select: { id: true }
    }).then(superAdmins => {
      if (!superAdmins.length) return
      return prisma.notifikasi.createMany({
        data: superAdmins.map(u => ({
          title: 'Booking Baru Masuk',
          subtitle: `${namaPemesan} — ${ruangan.aset.nama} ${ruangan.nama} | ${nomorBooking}`,
          avatarIcon: 'tabler-calendar-plus',
          avatarColor: 'warning',
          type: 'tagihan',
          url: '/booking',
          refId: tagihan.id,
          userId: u.id
        }))
      })
    }).catch(err => console.error('[Booking] Notifikasi super admin error:', err))

    return NextResponse.json({
      data: { penyewa, tagihan, nomorBooking },
      message: 'Booking berhasil dibuat'
    }, { status: 201 })
  } catch (error) {
    console.error('Create booking error:', error)

    return NextResponse.json({ message: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
