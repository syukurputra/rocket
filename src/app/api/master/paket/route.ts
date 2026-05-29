import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import prisma from '@/src/libs/prisma'
import { withAuth, type AuthContext } from '@/src/libs/auth-middleware'

// GET /api/master/paket - List all paket
async function handleGet(request: NextRequest, { user }: AuthContext) {
  try {
    const pakets = await prisma.masterPaket.findMany({
      include: {
        paketMenus: {
          select: {
            deskripsi: true,
            tampilkan: true,
            menu: {
              select: {
                id: true,
                nama: true,
                keterangan: true
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
    console.error('Get pakets error:', error)

    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/master/paket - Create new paket
async function handlePost(request: NextRequest, { user }: AuthContext) {
  try {
    const body = await request.json()
    const { nama, deskripsi, iconUrl, hargaBulanan, hargaTahunan, urutan = 0, status = true } = body

    if (!nama) {
      return NextResponse.json({ message: 'Nama paket harus diisi' }, { status: 400 })
    }

    const paket = await prisma.masterPaket.create({
      data: {
        nama,
        deskripsi: deskripsi || null,
        iconUrl: iconUrl || null,
        hargaBulanan,
        hargaTahunan,
        urutan,
        status
      }
    })

    return NextResponse.json(
      {
        data: paket,
        message: 'Paket berhasil dibuat'
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Create paket error:', error)

    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

export const GET = withAuth(handleGet)
export const POST = withAuth(handlePost)
