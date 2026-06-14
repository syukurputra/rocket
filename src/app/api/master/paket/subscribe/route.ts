import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import prisma from '@/src/libs/prisma'
import { withAuth, type AuthContext } from '@/src/libs/auth-middleware'

// POST /api/master/paket/subscribe - Subscribe company to a paket
async function handlePost(request: NextRequest, { user }: AuthContext) {
  try {
    if (!user.companyId) {
      return NextResponse.json({ message: 'Anda tidak terhubung dengan perusahaan' }, { status: 400 })
    }

    const body = await request.json()
    const { paketId } = body

    if (!paketId) {
      return NextResponse.json({ message: 'paketId harus diisi' }, { status: 400 })
    }

    // Verify the paket exists and is active
    const paket = await prisma.masterPaket.findUnique({
      where: { id: paketId }
    })

    if (!paket) {
      return NextResponse.json({ message: 'Paket tidak ditemukan' }, { status: 404 })
    }

    if (!paket.status) {
      return NextResponse.json({ message: 'Paket tidak aktif' }, { status: 400 })
    }

    // Update company's active paket
    const now = new Date()
    const oneYearLater = new Date(now)

    oneYearLater.setFullYear(oneYearLater.getFullYear() + 1)

    const company = await prisma.company.update({
      where: { id: user.companyId },
      data: {
        paketId,
        paketStartDate: now,
        paketEndDate: oneYearLater
      }
    })

    return NextResponse.json({
      data: company,
      message: `Berhasil berlangganan paket ${paket.nama}`
    })
  } catch (error) {
    console.error('Subscribe paket error:', error)

    return NextResponse.json({ message: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

export const POST = withAuth(handlePost)
