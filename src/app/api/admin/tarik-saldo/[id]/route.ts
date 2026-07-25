import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import prisma from '@/src/libs/prisma'
import { withAuth, type AuthContext } from '@/src/libs/auth-middleware'

export const runtime = 'nodejs'

type ParamCtx = AuthContext & { params: { id: string } }

// GET /api/admin/tarik-saldo/[id] — detail satu penarikan saldo, LINTAS company.
// Hanya superadmin.
async function handleGet(_request: NextRequest, { user, params }: ParamCtx) {
  try {
    const isSuperAdmin =
      user.roleId === 'superadmin' ||
      user.role?.nama?.toLowerCase().replace(/\s+/g, '') === 'superadmin'

    if (!isSuperAdmin) {
      return NextResponse.json({ message: 'Akses ditolak' }, { status: 403 })
    }

    const { id } = params

    const headerRows = await prisma.$queryRaw<
      {
        id: string
        companyId: string
        companyNama: string | null
        bankPenerima: string | null
        nomorRekening: string | null
        rekeningPenerima: string | null
        jumlahTransaksi: number
        jumlahNominal: any
        biayaLayanan: any
        nilaiTransfer: any
        status: string
        buktiTransfer: string | null
        tanggalRequest: Date
      }[]
    >`
      SELECT ts.id, ts."companyId", c.nama AS "companyNama",
             c."bankPenerima", c."nomorRekening", c."rekeningPenerima",
             ts."jumlahTransaksi", ts."jumlahNominal",
             ts."biayaLayanan", ts."nilaiTransfer", ts.status, ts."buktiTransfer", ts."tanggalRequest"
      FROM "tarik_saldo" ts
      LEFT JOIN "company" c ON c.id = ts."companyId"
      WHERE ts.id = ${id}
      LIMIT 1
    `

    if (headerRows.length === 0) {
      return NextResponse.json({ message: 'Data tidak ditemukan' }, { status: 404 })
    }

    const h = headerRows[0]

    const header = {
      id: h.id,
      companyNama: h.companyNama,
      bankPenerima: h.bankPenerima,
      nomorRekening: h.nomorRekening,
      rekeningPenerima: h.rekeningPenerima,
      jumlahTransaksi: Number(h.jumlahTransaksi ?? 0),
      jumlahNominal: Number(h.jumlahNominal ?? 0),
      biayaLayanan: Number(h.biayaLayanan ?? 0),
      nilaiTransfer: Number(h.nilaiTransfer ?? 0),
      status: h.status,
      buktiTransfer: h.buktiTransfer,
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
      WHERE t."tarikSaldoId" = ${id}
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
    console.error('Get admin tarik saldo detail error:', error)

    return NextResponse.json({ message: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

// PUT /api/admin/tarik-saldo/[id]  { buktiTransfer: string }
// Simpan bukti transfer & tandai penarikan selesai. Hanya superadmin.
async function handlePut(request: NextRequest, { user, params }: ParamCtx) {
  try {
    const isSuperAdmin =
      user.roleId === 'superadmin' ||
      user.role?.nama?.toLowerCase().replace(/\s+/g, '') === 'superadmin'

    if (!isSuperAdmin) {
      return NextResponse.json({ message: 'Akses ditolak' }, { status: 403 })
    }

    const { id } = params
    const body = await request.json()
    const buktiTransfer: string = body?.buktiTransfer || ''

    if (!buktiTransfer) {
      return NextResponse.json({ message: 'Bukti transfer wajib diisi' }, { status: 400 })
    }

    const existing = await prisma.$queryRaw<{ id: string }[]>`
      SELECT id FROM "tarik_saldo" WHERE id = ${id} LIMIT 1
    `

    if (existing.length === 0) {
      return NextResponse.json({ message: 'Data tidak ditemukan' }, { status: 404 })
    }

    await prisma.$executeRaw`
      UPDATE "tarik_saldo"
      SET "buktiTransfer" = ${buktiTransfer}, status = 'SELESAI', "updatedAt" = NOW()
      WHERE id = ${id}
    `

    return NextResponse.json({ message: 'Bukti transfer berhasil disimpan' })
  } catch (error) {
    console.error('Update admin tarik saldo error:', error)

    return NextResponse.json({ message: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

export const GET = withAuth<{ id: string }>(handleGet)
export const PUT = withAuth<{ id: string }>(handlePut)
