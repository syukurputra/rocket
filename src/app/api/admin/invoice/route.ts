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
    const company = searchParams.get('company') || ''
    const dari = searchParams.get('dari') || ''
    const sampai = searchParams.get('sampai') || ''
    const invDari = searchParams.get('invDari') || ''
    const invSampai = searchParams.get('invSampai') || ''
    const skip = (page - 1) * limit

    const where: any = {}

    if (status) where.status = status
    if (company) where.company = { nama: { contains: company, mode: 'insensitive' } }
    if (dari || sampai) {
      where.tanggalBayar = {}
      if (dari) where.tanggalBayar.gte = new Date(`${dari}T00:00:00`)
      if (sampai) where.tanggalBayar.lte = new Date(`${sampai}T23:59:59`)
    }
    if (invDari || invSampai) {
      where.tanggalInvoice = {}
      if (invDari) where.tanggalInvoice.gte = new Date(`${invDari}T00:00:00`)
      if (invSampai) where.tanggalInvoice.lte = new Date(`${invSampai}T23:59:59`)
    }

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

    return NextResponse.json({ message: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

export const GET = withAuth(handleGet)
