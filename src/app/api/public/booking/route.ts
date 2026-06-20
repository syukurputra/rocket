import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import prisma from '@/src/libs/prisma'
import { sendBookingCreatedEmail } from '@/src/mails/bookingCreatedEmail'

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
      return NextResponse.json({ message: 'Ruangan tidak ditemukan' }, { status: 404 })
    }

    // Find company's first user to use as createdById for records
    const companyUser = await prisma.user.findFirst({
      where: { companyId: ruangan.companyId },
      orderBy: { createdAt: 'asc' }
    })

    if (!companyUser) {
      return NextResponse.json({ message: 'Company tidak valid' }, { status: 400 })
    }

    const mulaiSewaDate = new Date(mulaiSewa)
    const selesaiSewaDate = new Date(selesaiSewa)
    const periodeSewa = JENIS_PERIODE[jenisHarga] || jenisHarga

    let penyewa

    if (userId) {
      // User sedang login: cek apakah sudah ada penyewa dengan userId ini di company ini
      const existingPenyewa = await prisma.penyewa.findFirst({
        where: { id: userId, companyId: ruangan.companyId }
      })

      if (existingPenyewa) {
        // Sudah ada penyewa → pakai yang sudah ada, skip create penyewa
        penyewa = existingPenyewa
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
        ruanganId,
        companyId: ruangan.companyId,
        createdById: companyUser.id,
        updatedById: companyUser.id
      }
    })

    const nomorBooking = `BK-${tagihan.id.slice(-8).toUpperCase()}`

    // Email ke penyewa
    if (email) {
      sendBookingCreatedEmail(email, {
        nomorBooking,
        namaPemesan,
        namaAset: ruangan.aset.nama,
        namaRuangan: ruangan.nama,
        periodeSewa,
        mulaiSewa: mulaiSewaDate.toISOString(),
        selesaiSewa: selesaiSewaDate.toISOString(),
        total: Number(total)
      }).catch(err => console.error('[Booking] Email error:', err))
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
          avatarColor: 'primary',
          type: 'tagihan',
          url: '/booking',
          refId: tagihan.id,
          userId: u.id
        }))
      })
    }).catch(err => console.error('[Booking] Notifikasi error:', err))

    return NextResponse.json({
      data: { penyewa, tagihan, nomorBooking },
      message: 'Booking berhasil dibuat'
    }, { status: 201 })
  } catch (error) {
    console.error('Create booking error:', error)

    return NextResponse.json({ message: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
