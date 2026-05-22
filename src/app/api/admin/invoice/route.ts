import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import prisma from '@/src/libs/prisma'
import { withAuth, type AuthContext } from '@/src/libs/auth-middleware'

// GET /api/admin/invoice - List all invoices across companies (admin only)
async function handleGet(request: NextRequest, { user }: AuthContext) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status') || ''
    const skip = (page - 1) * limit

    const where: any = {}

    if (status) where.status = status

    const [invoices, totalCount] = await Promise.all([
      prisma.invoice.findMany({
        where,
        include: {
          paket: { select: { id: true, nama: true, hargaBulanan: true, hargaTahunan: true } },
          company: { select: { id: true, nama: true, email: true, alamat: true, telepon: true } },
          createdBy: { select: { id: true, username: true, email: true } }
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.invoice.count({ where })
    ])

    const totalPages = Math.ceil(totalCount / limit)

    return NextResponse.json({
      data: invoices,
      pagination: { totalCount, totalPages, page, limit },
      message: 'Data invoice berhasil diambil'
    })
  } catch (error) {
    console.error('Admin get invoices error:', error)

    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

export const GET = withAuth(handleGet)
