import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import prisma from '@/src/libs/prisma'
import { withAuth, type AuthContext } from '@/src/libs/auth-middleware'

// GET /api/company/[id] - Get company by ID (Super Admin only)
async function handleGet(request: NextRequest, { user, params }: AuthContext & { params: { id: string } }) {
  try {
    const company = await prisma.company.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            users: true,
            aset: true,
            roles: true
          }
        }
      }
    })

    if (!company) {
      return NextResponse.json({ message: 'Perusahaan tidak ditemukan' }, { status: 404 })
    }

    return NextResponse.json({
      data: company,
      message: 'Data perusahaan berhasil diambil'
    })
  } catch (error) {
    console.error('Get company error:', error)

    return NextResponse.json({ message: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

// PUT /api/company/[id] - Update company (Super Admin only)
async function handlePut(request: NextRequest, { user, params }: AuthContext & { params: { id: string } }) {
  try {
    const body = await request.json()
    const { nama, alamat, telepon, email, status, paketStartDate, paketEndDate } = body

    const company = await prisma.company.update({
      where: { id: params.id },
      data: {
        ...(nama && { nama }),
        ...(alamat !== undefined && { alamat }),
        ...(telepon !== undefined && { telepon }),
        ...(email !== undefined && { email }),
        ...(status !== undefined && { status }),
        ...(paketStartDate !== undefined && { paketStartDate: paketStartDate ? new Date(paketStartDate) : null }),
        ...(paketEndDate !== undefined && { paketEndDate: paketEndDate ? new Date(paketEndDate) : null })
      }
    })

    return NextResponse.json({
      data: company,
      message: 'Perusahaan berhasil diperbarui'
    })
  } catch (error) {
    console.error('Update company error:', error)

    return NextResponse.json({ message: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

// DELETE /api/company/[id] - Delete company (Super Admin only)
async function handleDelete(request: NextRequest, { user, params }: AuthContext & { params: { id: string } }) {
  try {
    await prisma.company.delete({
      where: { id: params.id }
    })

    return NextResponse.json({
      message: 'Perusahaan berhasil dihapus'
    })
  } catch (error) {
    console.error('Delete company error:', error)

    return NextResponse.json({ message: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

export const GET = withAuth(handleGet)
export const PUT = withAuth(handlePut)
export const DELETE = withAuth(handleDelete)
