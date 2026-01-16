import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import prisma from '@/src/libs/prisma'
import { withAuth, type AuthContext } from '@/src/libs/auth-middleware'

// GET /api/setting/category-keuangan/dp - Dropdown list of active categories
async function handleGet(request: NextRequest, { user }: AuthContext) {
  try {
    if (!user.companyId) {
      return NextResponse.json({ message: 'User tidak terkait dengan perusahaan' }, { status: 400 })
    }

    const categories = await prisma.categoryKeuangan.findMany({
      where: {
        companyId: user.companyId,
        status: true
      },
      select: {
        id: true,
        nama: true,
        deskripsi: true,
        color: true,
        jenis: true,
        icon: {
          select: {
            id: true,
            nama: true,
            code: true
          }
        }
      },
      orderBy: { nama: 'asc' }
    })

    return NextResponse.json({
      data: categories,
      message: 'Categories retrieved successfully'
    })
  } catch (error) {
    console.error('Get category dropdown error:', error)

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
