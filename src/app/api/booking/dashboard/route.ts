import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import prisma from '@/src/libs/prisma'
import { withAuth, type AuthContext } from '@/src/libs/auth-middleware'
import { getBiayaLayanan } from '@/src/libs/getBiayaLayanan'

async function generateNomorTagihan(): Promise<string> {
  const now = new Date()
  const prefix = `TG-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}-`
  const rows = await prisma.$queryRawUnsafe<{ nomorTagihan: string }[]>(
    `SELECT "nomorTagihan" FROM "tagihan" WHERE "nomorTagihan" LIKE $1 ORDER BY "nomorTagihan" DESC LIMIT 1`,
    `${prefix}%`
  )
  const lastNum = rows.length > 0 ? parseInt(rows[0].nomorTagihan.slice(-5)) : 0
  return `${prefix}${String(lastNum + 1).padStart(5, '0')}`
}

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

    // Biaya layanan mengikuti jenjang total booking, dihitung di server
    const adminBooking = await getBiayaLayanan(Number(total))

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
        itemAsetId: ruanganId,
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
        itemAsetId: ruanganId,
        companyId: user.companyId,
        createdById: user.id,
        updatedById: user.id
      }
    })

    const hargaMerchant = Math.max(0, Number(total) - adminBooking)
    const nomorTagihan = await generateNomorTagihan()
    await prisma.$executeRaw`UPDATE "tagihan" SET "adminBooking" = ${adminBooking}, "hargaMerchant" = ${hargaMerchant}, "nomorTagihan" = ${nomorTagihan} WHERE id = ${tagihan.id}`

    const nomorBooking = nomorTagihan

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
