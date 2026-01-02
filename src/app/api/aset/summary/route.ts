import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import prisma from '@/src/libs/prisma'
import { withAuth, type AuthContext } from '@/src/libs/auth-middleware'

async function handleGet(request: NextRequest, { user }: AuthContext) {
  try {
    // Get total assets count
    const totalAset = await prisma.aset.count({
      where: {
        createdById: user.id
      }
    })

    // Get active assets count (status = true)
    const totalAsetAktif = await prisma.aset.count({
      where: {
        createdById: user.id,
        status: true
      }
    })

    // Get inactive assets count (status = false)
    const totalAsetNonAktif = await prisma.aset.count({
      where: {
        createdById: user.id,
        status: false
      }
    })

    // Get total rooms with active assets
    // We need to count distinct rooms that belong to active assets
    const totalRuanganDenganAsetAktif = await prisma.ruangan.count({
      where: {
        createdById: user.id,
        aset: {
          status: true
        }
      }
    })

    return NextResponse.json({
      data: {
        totalAset,
        totalAsetAktif,
        totalAsetNonAktif,
        totalRuanganDenganAsetAktif
      },
      message: 'Asset summary retrieved successfully'
    })
  } catch (error) {
    console.error('Get asset summary error:', error)

    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

export const GET = withAuth(handleGet)
