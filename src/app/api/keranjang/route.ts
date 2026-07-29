import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import prisma from '@/src/libs/prisma'
import { withAuth, type AuthContext } from '@/src/libs/auth-middleware'

// GET /api/keranjang — isi keranjang user yang login
async function handleGet(_request: NextRequest, { user }: AuthContext) {
  try {
    const items = await prisma.keranjang.findMany({
      where: { userId: user.id },
      include: {
        aset: { select: { id: true, nama: true, alamat: true, kota: true } },
        itemAset: { select: { id: true, nama: true } }
      },
      orderBy: { createdAt: 'asc' }
    })

    const mapped = items.map(item => ({
      id: item.id,
      asetId: item.asetId,
      asetNama: item.aset?.nama || '',
      asetAlamat: [item.aset?.alamat, item.aset?.kota].filter(Boolean).join(', '),
      itemAsetId: item.itemAsetId,
      itemAsetNama: item.itemAset?.nama || '',
      jenisHarga: item.jenisHarga,
      mulaiSewa: item.mulaiSewa.toISOString(),
      selesaiSewa: item.selesaiSewa.toISOString(),
      durasi: item.durasi,
      hargaSatuan: Number(item.hargaSatuan),
      total: Number(item.total),
      catatan: item.catatan
    }))

    // Biaya layanan tidak ditambahkan ke tagihan pemesan — nominalnya dipotong
    // dari pembayaran di sisi backend saat checkout (lihat adminBooking).
    const subtotal = mapped.reduce((acc, i) => acc + i.total, 0)

    return NextResponse.json({
      data: mapped,
      summary: {
        jumlahItem: mapped.length,
        subtotal,
        totalBayar: subtotal
      },
      message: 'Data berhasil diambil'
    })
  } catch (error) {
    console.error('Get keranjang error:', error)

    return NextResponse.json({ message: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

// POST /api/keranjang — tambah booking ke keranjang
async function handlePost(request: NextRequest, { user }: AuthContext) {
  try {
    const body = await request.json()
    const { itemAsetId, jenisHarga, mulaiSewa, selesaiSewa, durasi, hargaSatuan, total, catatan } = body

    if (!itemAsetId || !jenisHarga || !mulaiSewa || !selesaiSewa || !durasi) {
      return NextResponse.json({ message: 'Data tidak lengkap' }, { status: 400 })
    }

    const itemAset = await prisma.ruangan.findUnique({
      where: { id: itemAsetId },
      include: { aset: { select: { id: true, nama: true } } }
    })

    if (!itemAset) {
      return NextResponse.json({ message: 'Item aset tidak ditemukan' }, { status: 404 })
    }

    const mulai = new Date(mulaiSewa)
    const selesai = new Date(selesaiSewa)

    // Keranjang hanya boleh berisi item dari satu aset — supaya satu kali bayar
    // hanya menyangkut satu pemilik sewaan.
    const existing = await prisma.keranjang.findFirst({ where: { userId: user.id } })

    if (existing && existing.asetId !== itemAset.asetId) {
      const asetLain = await prisma.aset.findUnique({
        where: { id: existing.asetId },
        select: { nama: true }
      })

      return NextResponse.json(
        {
          message: `Keranjang sudah berisi booking dari aset "${asetLain?.nama || 'lain'}". Booking hanya bisa digabung dalam satu aset yang sama.`,
          code: 'ASET_BERBEDA'
        },
        { status: 409 }
      )
    }

    // Tanggal yang sudah dibayar orang lain tidak boleh masuk keranjang
    const konflikTagihan = await prisma.tagihan.findFirst({
      where: {
        itemAsetId,
        status: 'LUNAS',
        AND: [{ mulaiSewa: { lte: selesai } }, { selesaiSewa: { gte: mulai } }]
      }
    })

    if (konflikTagihan) {
      return NextResponse.json({ message: 'Tanggal yang dipilih tidak tersedia' }, { status: 409 })
    }

    // Bentrok dengan item lain di keranjang sendiri
    const konflikKeranjang = await prisma.keranjang.findFirst({
      where: {
        userId: user.id,
        itemAsetId,
        AND: [{ mulaiSewa: { lte: selesai } }, { selesaiSewa: { gte: mulai } }]
      }
    })

    if (konflikKeranjang) {
      return NextResponse.json(
        { message: 'Jadwal ini bentrok dengan item yang sudah ada di keranjang' },
        { status: 409 }
      )
    }

    const item = await prisma.keranjang.create({
      data: {
        userId: user.id,
        companyId: itemAset.companyId,
        asetId: itemAset.asetId,
        itemAsetId,
        jenisHarga,
        mulaiSewa: mulai,
        selesaiSewa: selesai,
        durasi: Number(durasi),
        hargaSatuan: Number(hargaSatuan) || 0,
        total: Number(total) || 0,
        catatan: catatan || null
      }
    })

    const jumlahItem = await prisma.keranjang.count({ where: { userId: user.id } })

    return NextResponse.json(
      { data: { id: item.id, jumlahItem }, message: 'Booking berhasil ditambahkan ke keranjang' },
      { status: 201 }
    )
  } catch (error) {
    console.error('Create keranjang error:', error)

    return NextResponse.json({ message: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

// DELETE /api/keranjang — kosongkan keranjang
async function handleDelete(_request: NextRequest, { user }: AuthContext) {
  try {
    await prisma.keranjang.deleteMany({ where: { userId: user.id } })

    return NextResponse.json({ message: 'Keranjang berhasil dikosongkan' })
  } catch (error) {
    console.error('Clear keranjang error:', error)

    return NextResponse.json({ message: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

export const GET = withAuth(handleGet)
export const POST = withAuth(handlePost)
export const DELETE = withAuth(handleDelete)
