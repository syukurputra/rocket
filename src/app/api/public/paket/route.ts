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
          select: {
            tampilkan: true,
            deskripsi: true,
            menu: {
              select: {
                id: true,
                nama: true,
                keterangan: true,
                icon: true
              }
            }
          }
        }
      },
      orderBy: [{ urutan: 'asc' }]
    })

    return NextResponse.json({
      data: pakets,
      message: 'Data paket berhasil diambil'
    })
  } catch (error) {
    console.error('Get public pakets error:', error)

    return NextResponse.json(
      {
        message: 'Terjadi kesalahan server',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
