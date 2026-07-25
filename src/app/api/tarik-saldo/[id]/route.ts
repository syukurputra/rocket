import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import prisma from '@/src/libs/prisma'
import { withAuth, type AuthContext } from '@/src/libs/auth-middleware'

export const runtime = 'nodejs'

type ParamCtx = AuthContext & { params: { id: string } }

// GET /api/tarik-saldo/[id] — daftar tagihan yang termasuk dalam satu penarikan saldo.
// Dibatasi ke company milik user (keamanan).
async function handleGet(_request: NextRequest, { user, params }: ParamCtx) {
  try {
    if (!user.companyId) {
      return NextResponse.json({ data: [] })
    }

    const { id } = params

    // Header penarikan (dibutuhkan halaman detail yang cuma punya id dari URL)
    const headerRows = await prisma.$queryRaw<
      {
        id: string
        jumlahTransaksi: number
        jumlahNominal: any
        biayaLayanan: any
        nilaiTransfer: any
        status: string
        tanggalRequest: Date
      }[]
    >`
      SELECT id, "jumlahTransaksi", "jumlahNominal", "biayaLayanan", "nilaiTransfer", status, "tanggalRequest"
      FROM "tarik_saldo"
      WHERE id = ${id} AND "companyId" = ${user.companyId}
      LIMIT 1
    `

    if (headerRows.length === 0) {
      return NextResponse.json({ message: 'Data tidak ditemukan' }, { status: 404 })
    }

    const h = headerRows[0]

    const header = {
      id: h.id,
      jumlahTransaksi: Number(h.jumlahTransaksi ?? 0),
      jumlahNominal: Number(h.jumlahNominal ?? 0),
      biayaLayanan: Number(h.biayaLayanan ?? 0),
      nilaiTransfer: Number(h.nilaiTransfer ?? 0),
      status: h.status,
      tanggalRequest: h.tanggalRequest
    }

    const rows = await prisma.$queryRaw<
      {
        id: string
        nomorTagihan: string | null
        keterangan: string
        nominal: any
        hargaMerchant: any
        adminBooking: any
        tanggalBayar: Date | null
        penyewaNama: string | null
        asetNama: string | null
        itemAsetNama: string | null
      }[]
    >`
      SELECT t.id, t."nomorTagihan", t.keterangan, t.nominal, t."hargaMerchant", t."adminBooking",
             t."tanggalBayar", p.nama AS "penyewaNama", a.nama AS "asetNama", r.nama AS "itemAsetNama"
      FROM "tagihan" t
      LEFT JOIN "penyewa" p ON p.id = t."penyewaId"
      LEFT JOIN "aset" a ON a.id = t."asetId"
      LEFT JOIN "item_aset" r ON r.id = t."itemAsetId"
      WHERE t."tarikSaldoId" = ${id} AND t."companyId" = ${user.companyId}
      ORDER BY t."tanggalBayar" DESC NULLS LAST
    `

    const items = rows.map(r => ({
      id: r.id,
      nomorTagihan: r.nomorTagihan,
      keterangan: r.keterangan,
      nominal: Number(r.nominal ?? 0),
      hargaMerchant: Number(r.hargaMerchant ?? 0),
      adminBooking: Number(r.adminBooking ?? 0),
      tanggalBayar: r.tanggalBayar,
      penyewaNama: r.penyewaNama,
      asetNama: r.asetNama,
      itemAsetNama: r.itemAsetNama
    }))

    return NextResponse.json({ data: { header, items }, message: 'Data berhasil diambil' })
  } catch (error) {
    console.error('Get tarik saldo detail error:', error)

    return NextResponse.json({ message: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

export const GET = withAuth<{ id: string }>(handleGet)
