import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import prisma from '@/src/libs/prisma'
import { withAuth, type AuthContext } from '@/src/libs/auth-middleware'

async function handleGet(request: NextRequest, { user }: AuthContext) {
  try {
    const [totalAset, totalItem, totalTersedia, totalTidakTersedia] = await Promise.all([
      prisma.aset.count({ where: { createdById: user.id } }),
      prisma.ruangan.count({ where: { createdById: user.id } }),
      prisma.ruangan.count({ where: { createdById: user.id, status: 'tidak huni' } }),
      prisma.ruangan.count({ where: { createdById: user.id, status: 'huni' } })
    ])

    return NextResponse.json({
      data: { totalAset, totalItem, totalTersedia, totalTidakTersedia },
      message: 'Ringkasan aset berhasil diambil'
    })
  } catch (error) {
    console.error('Get asset summary error:', error)

    return NextResponse.json({ message: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

export const GET = withAuth(handleGet)
