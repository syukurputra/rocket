import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import prisma from '@/src/libs/prisma'
import { withAuth, type AuthContext } from '@/src/libs/auth-middleware'

// GET: Fetch all fasilitas for a specific aset
async function handleGet(req: NextRequest, { user }: AuthContext) {
  try {
    const { searchParams } = new URL(req.url)
    const asetId = searchParams.get('asetId')

    if (!asetId) {
      return NextResponse.json({ error: 'asetId is required' }, { status: 400 })
    }

    const fasilitas = await prisma.fasilitasAset.findMany({
      where: {
        asetId
      },
      include: {
        icon: {
          select: {
            id: true,
            nama: true,
            code: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(fasilitas)
  } catch (error) {
    console.error('Error fetching fasilitas aset:', error)

    return NextResponse.json({ error: 'Failed to fetch fasilitas aset' }, { status: 500 })
  }
}

// POST: Create new fasilitas aset
async function handlePost(req: NextRequest, { user }: AuthContext) {
  try {
    const body = await req.json()
    const { nama, iconId, asetId } = body

    if (!nama || !iconId || !asetId) {
      return NextResponse.json({ error: 'nama, iconId, and asetId are required' }, { status: 400 })
    }

    const fasilitas = await prisma.fasilitasAset.create({
      data: {
        nama,
        iconId,
        asetId
      },
      include: {
        icon: {
          select: {
            id: true,
            nama: true,
            code: true
          }
        }
      }
    })

    return NextResponse.json(fasilitas, { status: 201 })
  } catch (error) {
    console.error('Error creating fasilitas aset:', error)

    return NextResponse.json({ error: 'Failed to create fasilitas aset' }, { status: 500 })
  }
}

export const GET = withAuth(handleGet)
export const POST = withAuth(handlePost)
