import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import prisma from '@/src/libs/prisma'
import { withAuth, type AuthContext } from '@/src/libs/auth-middleware'

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
    const company = searchParams.get('company') || ''
    const dari = searchParams.get('dari') || ''
    const sampai = searchParams.get('sampai') || ''
    const search = searchParams.get('search') || ''

    const conditions: string[] = []
    const params: any[] = []

    if (status) {
      params.push(status)
      conditions.push(`t.status = $${params.length}`)
    }
    if (company) {
      params.push(`%${company}%`)
      conditions.push(`c.nama ILIKE $${params.length}`)
    }
    if (dari) {
      params.push(new Date(dari))
      conditions.push(`t."createdAt" >= $${params.length}`)
    }
    if (sampai) {
      params.push(new Date(`${sampai}T23:59:59`))
      conditions.push(`t."createdAt" <= $${params.length}`)
    }
    if (search) {
      params.push(`%${search}%`)
      conditions.push(`(t.keterangan ILIKE $${params.length} OR p.nama ILIKE $${params.length})`)
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    const sql = `
      SELECT
        COUNT(*) FILTER (WHERE t.status = 'LUNAS') AS count_sukses,
        COALESCE(SUM(t.nominal) FILTER (WHERE t.status = 'LUNAS'), 0) AS total_sukses,
        COUNT(*) FILTER (WHERE t."statusRekon" = 'SESUAI') AS count_rekon,
        COALESCE(SUM(t."amountPembayaran") FILTER (WHERE t."statusRekon" = 'SESUAI'), 0) AS total_rekon,
        COALESCE(SUM(t."amountFee") FILTER (WHERE t."statusRekon" = 'SESUAI'), 0) AS total_fee
      FROM "tagihan" t
      LEFT JOIN "company" c ON c.id = t."companyId"
      LEFT JOIN "penyewa" p ON p.id = t."penyewaId"
      ${whereClause}
    `

    const [row] = await prisma.$queryRawUnsafe<{
      count_sukses: bigint
      total_sukses: string
      count_rekon: bigint
      total_rekon: string
      total_fee: string
    }[]>(sql, ...params)

    return NextResponse.json({
      data: {
        countSukses: Number(row?.count_sukses ?? 0),
        totalSukses: parseFloat(String(row?.total_sukses ?? '0')),
        countRekon: Number(row?.count_rekon ?? 0),
        totalRekon: parseFloat(String(row?.total_rekon ?? '0')),
        totalFee: parseFloat(String(row?.total_fee ?? '0'))
      }
    })
  } catch (error) {
    console.error('Tagihan stats error:', error)

    return NextResponse.json({ message: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

export const GET = withAuth(handleGet)
