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
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status') || ''
    const company = searchParams.get('company') || ''
    const dari = searchParams.get('dari') || ''
    const sampai = searchParams.get('sampai') || ''
    const search = searchParams.get('search') || ''

    const where: any = {}

    if (status) where.status = status
    if (company) where.company = { nama: { contains: company, mode: 'insensitive' } }
    if (dari || sampai) {
      where.createdAt = {}
      if (dari) where.createdAt.gte = new Date(dari)
      if (sampai) where.createdAt.lte = new Date(`${sampai}T23:59:59`)
    }
    if (search) {
      where.OR = [
        { keterangan: { contains: search, mode: 'insensitive' } },
        { penyewa: { nama: { contains: search, mode: 'insensitive' } } }
      ]
    }

    const [data, totalCount] = await Promise.all([
      prisma.tagihan.findMany({
        where,
        include: {
          company: { select: { id: true, nama: true } },
          penyewa: { select: { id: true, nama: true, email: true, nomorTelepon: true } },
          aset: { select: { id: true, nama: true } },
          ruangan: { select: { id: true, nama: true } }
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.tagihan.count({ where })
    ])

    // Fetch rekon fields via raw SQL
    const ids = data.map((d: any) => d.id)
    const rekonRows = ids.length > 0
      ? await prisma.$queryRaw<{ id: string; nomorTagihan: string | null; statusRekon: string | null; amountPembayaran: string | null; amountFee: string | null; typePembayaran: string | null; paymentChannel: string | null; paymentNo: string | null }[]>`
          SELECT id, "nomorTagihan", "statusRekon", "amountPembayaran", "amountFee", "typePembayaran", "paymentChannel", "paymentNo"
          FROM "tagihan"
          WHERE id = ANY(${ids}::text[])
        `
      : []

    const rekonMap = new Map(rekonRows.map(r => [r.id, r]))

    const totalPages = Math.ceil(totalCount / limit)

    const mappedData = data.map(({ ruangan, ...rest }: any) => ({
      ...rest,
      itemAset: ruangan,
      ...rekonMap.get(rest.id)
    }))

    return NextResponse.json({
      data: mappedData,
      pagination: { page, limit, totalCount, totalPages }
    })
  } catch (error) {
    console.error('Admin tagihan list error:', error)

    return NextResponse.json({ message: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

export const GET = withAuth(handleGet)
