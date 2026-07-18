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

    const [company, lastInvoice] = await Promise.all([
      prisma.company.findUnique({
        where: { id: user.companyId },
        include: {
          paket: {
            select: { id: true, nama: true, deskripsi: true }
          }
        }
      }),
      prisma.invoice.findFirst({
        where: { companyId: user.companyId, status: 'PAID' },
        orderBy: { tanggalBayar: 'desc' },
        select: {
          id: true,
          nomorInvoice: true,
          billingCycle: true,
          subtotal: true,
          total: true,
          tanggalBayar: true,
          tanggalInvoice: true,
          paket: {
            select: { id: true, nama: true, deskripsi: true, hargaBulanan: true, hargaTahunan: true }
          }
        }
      })
    ])

    if (!company) {
      return NextResponse.json({ message: 'Company tidak ditemukan' }, { status: 404 })
    }

    return NextResponse.json({
      data: { ...company, lastInvoice: lastInvoice ?? null },
      message: 'Data perusahaan berhasil diambil'
    })
  } catch (error) {
    console.error('Get company error:', error)

    return NextResponse.json(
      {
        message: 'Terjadi kesalahan server',
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
      message: 'Perusahaan berhasil diperbarui'
    })
  } catch (error) {
    console.error('Update company error:', error)

    return NextResponse.json(
      {
        message: 'Terjadi kesalahan server',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export const GET = withAuth(handleGet)
export const PUT = withAuth(handlePut)
