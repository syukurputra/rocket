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
    const invDari = searchParams.get('invDari') || ''
    const invSampai = searchParams.get('invSampai') || ''

    const where: any = {}

    if (status) where.status = status
    if (company) where.company = { nama: { contains: company, mode: 'insensitive' } }
    if (dari || sampai) {
      where.tanggalBayar = {}
      if (dari) where.tanggalBayar.gte = new Date(dari)
      if (sampai) where.tanggalBayar.lte = new Date(`${sampai}T23:59:59`)
    }
    if (invDari || invSampai) {
      where.tanggalInvoice = {}
      if (invDari) where.tanggalInvoice.gte = new Date(invDari)
      if (invSampai) where.tanggalInvoice.lte = new Date(`${invSampai}T23:59:59`)
    }

    const [data, totalCount] = await Promise.all([
      prisma.invoice.findMany({
        where,
        include: {
          company: { select: { id: true, nama: true, email: true, alamat: true, telepon: true } },
          paket: { select: { id: true, nama: true } }
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.invoice.count({ where })
    ])

    // Fetch rekon fields via raw SQL (Prisma client cache mungkin belum include field baru)
    const ids = data.map(d => d.id)
    const rekonRows = ids.length > 0
      ? await prisma.$queryRaw<{ id: string; statusRekon: string | null; amountPembayaran: string | null; amountFee: string | null; typePembayaran: string | null; paymentChannel: string | null; paymentNo: string | null }[]>`
          SELECT id, "statusRekon", "amountPembayaran", "amountFee", "typePembayaran", "paymentChannel", "paymentNo"
          FROM "invoice"
          WHERE id = ANY(${ids}::text[])
        `
      : []

    const rekonMap = new Map(rekonRows.map(r => [r.id, r]))
    const enriched = data.map(d => ({ ...d, ...rekonMap.get(d.id) }))

    const totalPages = Math.ceil(totalCount / limit)

    return NextResponse.json({
      data: enriched,
      pagination: { page, limit, totalCount, totalPages }
    })
  } catch (error) {
    console.error('Admin invoice list error:', error)

    return NextResponse.json({ message: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

async function handlePatch(request: NextRequest, { user }: AuthContext) {
  return NextResponse.json({ message: 'Method not allowed' }, { status: 405 })
}

export const GET = withAuth(handleGet)
