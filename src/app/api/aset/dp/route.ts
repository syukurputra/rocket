import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/src/libs/prisma'
import { withAuth, type AuthContext } from '@/src/libs/auth-middleware'

async function handleGet(
  request: NextRequest,
  { user }: AuthContext
) {
  try {
    const where = {
      createdById: user.id
    }

    // Fetch data dengan relations
    const [data] = await Promise.all([
      prisma.aset.findMany({
        where,
        select: {
          id: true,
          nama: true,
          jenis: true
        },
        orderBy: { nama: 'desc' }
      }),
    ])

    return NextResponse.json({
      data,
      message: 'Data berhasil diambil'
    })

  } catch (error) {
    console.error('Get aset error:', error)
    return NextResponse.json(
      { message: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

export const GET = withAuth(handleGet)