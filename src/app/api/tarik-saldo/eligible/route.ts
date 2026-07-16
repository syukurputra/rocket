import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import prisma from '@/src/libs/prisma'
import { withAuth, type AuthContext } from '@/src/libs/auth-middleware'

export const runtime = 'nodejs'

// GET /api/tarik-saldo/eligible
// Tagihan milik company dengan statusRekon='SESUAI' dan belum ditarik (tarikSaldoId IS NULL)
async function handleGet(_request: NextRequest, { user }: AuthContext) {
  try {
    if (!user.companyId) {
      return NextResponse.json({ data: [], total: { jumlahTransaksi: 0, jumlahNominal: 0 } })
    }

    const rows = await prisma.$queryRaw<
      {
        id: string
        nomorTagihan: string | null
        keterangan: string
        nominal: any
        hargaMerchant: any
        adminBooking: any
        createdAt: Date
        penyewaNama: string | null
        asetNama: string | null
        itemAsetNama: string | null
      }[]
    >`
      SELECT t.id, t."nomorTagihan", t.keterangan, t.nominal, t."hargaMerchant", t."adminBooking",
             t."createdAt", p.nama AS "penyewaNama", a.nama AS "asetNama", r.nama AS "itemAsetNama"
      FROM "tagihan" t
      LEFT JOIN "penyewa" p ON p.id = t."penyewaId"
      LEFT JOIN "aset" a ON a.id = t."asetId"
      LEFT JOIN "item_aset" r ON r.id = t."ruanganId"
      WHERE t."companyId" = ${user.companyId}
        AND t."statusRekon" = 'SESUAI'
        AND t."tarikSaldoId" IS NULL
      ORDER BY t."createdAt" DESC
    `

    const data = rows.map(r => ({
      id: r.id,
      nomorTagihan: r.nomorTagihan,
      keterangan: r.keterangan,
      nominal: Number(r.nominal ?? 0),
      hargaMerchant: Number(r.hargaMerchant ?? 0),
      adminBooking: Number(r.adminBooking ?? 0),
      createdAt: r.createdAt,
      penyewaNama: r.penyewaNama,
      asetNama: r.asetNama,
      itemAsetNama: r.itemAsetNama
    }))

    const jumlahNominal = data.reduce((sum, d) => sum + d.hargaMerchant, 0)

    return NextResponse.json({
      data,
      total: { jumlahTransaksi: data.length, jumlahNominal },
      message: 'Data berhasil diambil'
    })
  } catch (error) {
    console.error('Get eligible tarik saldo error:', error)

    return NextResponse.json({ message: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

export const GET = withAuth(handleGet)
