import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import prisma from '@/src/libs/prisma'
import { withAuth, type AuthContext } from '@/src/libs/auth-middleware'

export const runtime = 'nodejs'

// GET /api/admin/tarik-saldo — SEMUA permintaan tarik saldo (semua company).
// Hanya superadmin.
async function handleGet(request: NextRequest, { user }: AuthContext) {
  try {
    const isSuperAdmin =
      user.roleId === 'superadmin' ||
      user.role?.nama?.toLowerCase().replace(/\s+/g, '') === 'superadmin'

    if (!isSuperAdmin) {
      return NextResponse.json({ message: 'Akses ditolak' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || ''
    const search = searchParams.get('search') || ''

    const conditions: string[] = []
    const params: any[] = []

    if (status) {
      params.push(status)
      conditions.push(`ts.status = $${params.length}`)
    }
    if (search) {
      params.push(`%${search}%`)
      conditions.push(`c.nama ILIKE $${params.length}`)
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    const sql = `
      SELECT ts.id, ts."jumlahTransaksi", ts."jumlahNominal", ts."biayaLayanan", ts."nilaiTransfer", ts.status,
             ts."tanggalRequest", ts."createdAt", c.nama AS "companyNama"
      FROM "tarik_saldo" ts
      LEFT JOIN "company" c ON c.id = ts."companyId"
      ${whereClause}
      ORDER BY ts."tanggalRequest" DESC
    `

    const rows = await prisma.$queryRawUnsafe<
      {
        id: string
        jumlahTransaksi: number
        jumlahNominal: string
        biayaLayanan: string
        nilaiTransfer: string
        status: string
        tanggalRequest: Date
        createdAt: Date
        companyNama: string | null
      }[]
    >(sql, ...params)

    const data = rows.map(r => ({
      id: r.id,
      companyNama: r.companyNama,
      jumlahTransaksi: Number(r.jumlahTransaksi ?? 0),
      jumlahNominal: Number(r.jumlahNominal ?? 0),
      biayaLayanan: Number(r.biayaLayanan ?? 0),
      nilaiTransfer: Number(r.nilaiTransfer ?? 0),
      status: r.status,
      tanggalRequest: r.tanggalRequest
    }))

    return NextResponse.json({ data, message: 'Data berhasil diambil' })
  } catch (error) {
    console.error('Admin tarik saldo list error:', error)

    return NextResponse.json({ message: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

export const GET = withAuth(handleGet)
