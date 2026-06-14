import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import prisma from '@/src/libs/prisma'
import { withAuth, type AuthContext } from '@/src/libs/auth-middleware'

// GET /api/company - List all companies (Super Admin only)
async function handleGet(request: NextRequest, { user }: AuthContext) {
  try {
    const companies = await prisma.company.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        _count: {
          select: {
            users: true,
            aset: true
          }
        }
      }
    })

    return NextResponse.json({
      data: companies,
      message: 'Data perusahaan berhasil diambil'
    })
  } catch (error) {
    console.error('Get companies error:', error)

    return NextResponse.json({ message: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

// POST /api/company - Create new company (Super Admin only)
async function handlePost(request: NextRequest, { user }: AuthContext) {
  try {
    const body = await request.json()
    const { nama, alamat, telepon, email, status = true, paketStartDate, paketEndDate } = body

    // Validation
    if (!nama) {
      return NextResponse.json({ message: 'Nama perusahaan wajib diisi' }, { status: 400 })
    }

    const company = await prisma.company.create({
      data: {
        nama,
        alamat,
        telepon,
        email,
        status,
        paketStartDate: paketStartDate ? new Date(paketStartDate) : null,
        paketEndDate: paketEndDate ? new Date(paketEndDate) : null
      }
    })

    return NextResponse.json(
      {
        data: company,
        message: 'Perusahaan berhasil dibuat'
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Create company error:', error)

    return NextResponse.json({ message: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

export const GET = withAuth(handleGet)
export const POST = withAuth(handlePost)
