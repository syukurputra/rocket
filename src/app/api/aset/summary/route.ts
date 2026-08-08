import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import prisma from '@/src/libs/prisma'
import { withAuth, type AuthContext } from '@/src/libs/auth-middleware'

async function handleGet(request: NextRequest, { user }: AuthContext) {
  try {
    // Status item aset yang dipakai form: 'aktif' / 'non aktif'
    const [totalAset, totalItem, totalItemAktif, totalItemNonAktif] = await Promise.all([
      prisma.aset.count({ where: { createdById: user.id } }),
      prisma.ruangan.count({ where: { createdById: user.id } }),
      prisma.ruangan.count({ where: { createdById: user.id, status: 'aktif' } }),
      prisma.ruangan.count({ where: { createdById: user.id, status: { not: 'aktif' } } })
    ])

    return NextResponse.json({
      data: { totalAset, totalItem, totalItemAktif, totalItemNonAktif },
      message: 'Ringkasan aset berhasil diambil'
    })
  } catch (error) {
    console.error('Get asset summary error:', error)

    return NextResponse.json({ message: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

export const GET = withAuth(handleGet)
