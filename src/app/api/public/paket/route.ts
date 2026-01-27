import { NextResponse } from 'next/server'

import prisma from '@/src/libs/prisma'

// GET /api/public/paket - Public endpoint to list active pakets (no auth required)
export async function GET() {
  try {
    const pakets = await prisma.masterPaket.findMany({
      where: {
        status: true // Only return active packages
      },
      include: {
        paketMenus: {
          include: {
            menu: {
              select: {
                id: true,
                nama: true,
                keterangan: true,
                icon: true
              }
            }
          },
          orderBy: {
            menu: {
              urutan: 'asc'
            }
          }
        }
      },
      orderBy: [{ harga: 'asc' }] // Order by price ascending
    })

    return NextResponse.json({
      data: pakets,
      message: 'Pakets retrieved successfully'
    })
  } catch (error) {
    console.error('Get public pakets error:', error)

    return NextResponse.json(
      {
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
