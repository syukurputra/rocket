import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import prisma from '@/src/libs/prisma'
import { withAuth, type AuthContext } from '@/src/libs/auth-middleware'

// GET /api/setting/company - Get company details
async function handleGet(request: NextRequest, { user }: AuthContext) {
  try {
    if (!user.companyId) {
      return NextResponse.json({ message: 'User tidak terkait dengan perusahaan' }, { status: 400 })
    }

    const company = await prisma.company.findUnique({
      where: {
        id: user.companyId
      },
      include: {
        paket: {
          select: {
            id: true,
            nama: true,
            deskripsi: true
          }
        }
      }
    })

    if (!company) {
      return NextResponse.json({ message: 'Company tidak ditemukan' }, { status: 404 })
    }

    return NextResponse.json({
      data: company,
      message: 'Company retrieved successfully'
    })
  } catch (error) {
    console.error('Get company error:', error)

    return NextResponse.json(
      {
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// PUT /api/setting/company - Update company details
async function handlePut(request: NextRequest, { user }: AuthContext) {
  try {
    if (!user.companyId) {
      return NextResponse.json({ message: 'User tidak terkait dengan perusahaan' }, { status: 400 })
    }

    const body = await request.json()
    const { nama, alamat, telepon, email } = body

    if (!nama) {
      return NextResponse.json({ message: 'Nama perusahaan harus diisi' }, { status: 400 })
    }

    const company = await prisma.company.update({
      where: {
        id: user.companyId
      },
      data: {
        nama,
        alamat: alamat || null,
        telepon: telepon || null,
        email: email || null
      },
      include: {
        paket: {
          select: {
            id: true,
            nama: true,
            deskripsi: true
          }
        }
      }
    })

    return NextResponse.json({
      data: company,
      message: 'Company updated successfully'
    })
  } catch (error) {
    console.error('Update company error:', error)

    return NextResponse.json(
      {
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export const GET = withAuth(handleGet)
export const PUT = withAuth(handlePut)
