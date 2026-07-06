import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import prisma from '@/src/libs/prisma'
import { withAuth, type AuthContext } from '@/src/libs/auth-middleware'

const JENIS_PERIODE: Record<string, string> = {
  JAM: 'jam',
  HARIAN: 'harian',
  BULANAN: 'bulanan',
  TAHUNAN: 'tahunan'
}

async function handlePost(request: NextRequest, { user }: AuthContext) {
  try {
    if (!user.companyId) {
      return NextResponse.json({ message: 'User tidak terkait dengan perusahaan' }, { status: 400 })
    }

    const body = await request.json()
    const {
      ruanganId,
      penyewaId,
      namaPemesan,
      telepon,
      email,
      jenisHarga,
      mulaiSewa,
      selesaiSewa,
      durasi,
      hargaSatuan,
      total,
      catatan,
      status = 'BELUM TERBAYAR'
    } = body

    if (!ruanganId || !jenisHarga || !mulaiSewa || !selesaiSewa || !total) {
      return NextResponse.json({ message: 'Data tidak lengkap' }, { status: 400 })
    }

    const ruangan = await prisma.ruangan.findUnique({
      where: { id: ruanganId },
      include: { aset: true }
    })

    if (!ruangan || ruangan.companyId !== user.companyId) {
      return NextResponse.json({ message: 'Item aset tidak ditemukan' }, { status: 404 })
    }

    const mulaiSewaDate = new Date(mulaiSewa)
    const selesaiSewaDate = new Date(selesaiSewa)
    const periodeSewa = JENIS_PERIODE[jenisHarga] || jenisHarga

    // Cek konflik tanggal
    const konflik = await prisma.tagihan.findFirst({
      where: {
        ruanganId,
        status: 'LUNAS',
        AND: [
          { mulaiSewa: { lte: selesaiSewaDate } },
          { selesaiSewa: { gte: mulaiSewaDate } }
        ]
      }
    })

    if (konflik) {
      return NextResponse.json({ message: 'Tanggal yang dipilih sudah terpesan' }, { status: 409 })
    }

    let penyewa

    if (penyewaId) {
      penyewa = await prisma.penyewa.findUnique({ where: { id: penyewaId } })
      if (!penyewa) {
        return NextResponse.json({ message: 'Penyewa tidak ditemukan' }, { status: 404 })
      }
    } else {
      if (!namaPemesan || !telepon) {
        return NextResponse.json({ message: 'Nama pemesan dan telepon wajib diisi' }, { status: 400 })
      }

      penyewa = await prisma.penyewa.create({
        data: {
          nama: namaPemesan,
          email: email || null,
          nomorTelepon: telepon,
          status: 'booking',
          companyId: user.companyId,
          createdById: user.id,
          updatedById: user.id
        }
      })
    }

    const keterangan = catatan
      ? `Booking ${ruangan.aset.nama} - ${ruangan.nama} (${periodeSewa} x${durasi}). ${catatan}`
      : `Booking ${ruangan.aset.nama} - ${ruangan.nama} (${periodeSewa} x${durasi})`

    const tagihan = await prisma.tagihan.create({
      data: {
        keterangan,
        status,
        periodeSewa,
        mulaiSewa: mulaiSewaDate,
        selesaiSewa: selesaiSewaDate,
        nominal: Number(total),
        penyewaId: penyewa.id,
        asetId: ruangan.asetId,
        ruanganId,
        companyId: user.companyId,
        createdById: user.id,
        updatedById: user.id
      }
    })

    const nomorBooking = `BK-${tagihan.id.slice(-8).toUpperCase()}`

    return NextResponse.json({
      data: { penyewa, tagihan, nomorBooking },
      message: 'Booking berhasil dibuat'
    }, { status: 201 })
  } catch (error) {
    console.error('Create dashboard booking error:', error)

    return NextResponse.json({ message: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

export const POST = withAuth(handlePost)
