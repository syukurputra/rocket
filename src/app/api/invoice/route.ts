import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import prisma from '@/src/libs/prisma'
import { withAuth, type AuthContext } from '@/src/libs/auth-middleware'
import { getParameter } from '@/src/libs/getParameter'

// GET /api/invoice - List invoices for the current company
async function handleGet(request: NextRequest, { user }: AuthContext) {
  try {
    if (!user.companyId) {
      return NextResponse.json({ message: 'Tidak terhubung dengan perusahaan' }, { status: 400 })
    }

    const DEMO_COMPANY_ID = await getParameter('COMPANY_SUPER')
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status') || ''
    const skip = (page - 1) * limit

    const isDemo = user.companyId === DEMO_COMPANY_ID
    const where: any = isDemo ? {} : { companyId: user.companyId }

    if (status) where.status = status

    const [invoices, totalCount] = await Promise.all([
      prisma.invoice.findMany({
        where,
        include: {
          paket: {
            select: { id: true, nama: true, hargaBulanan: true, hargaTahunan: true }
          },
          company: {
            select: { id: true, nama: true }
          },
          createdBy: {
            select: { id: true, username: true, email: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.invoice.count({ where })
    ])

    const totalPages = Math.ceil(totalCount / limit)

    return NextResponse.json({
      data: invoices,
      pagination: {
        totalCount,
        totalPages,
        page,
        limit,
        hasNext: page < totalPages,
        hasPrev: page > 1
      },
      message: 'Data invoice berhasil diambil'
    })
  } catch (error) {
    console.error('Get invoices error:', error)

    return NextResponse.json({ message: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

// POST /api/invoice - Dulu membuat invoice berlangganan paket. Bantu Sewa kini
// 100% gratis sehingga paket tidak bisa dibeli lagi; invoice lama tetap bisa
// dilihat lewat GET.
async function handlePost() {
  return NextResponse.json(
    { message: 'Bantu Sewa kini 100% gratis — tidak ada paket yang perlu dibeli.' },
    { status: 410 }
  )
}

export const GET = withAuth(handleGet)
export const POST = withAuth(handlePost)
