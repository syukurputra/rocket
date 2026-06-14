import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import prisma from '@/src/libs/prisma'
import { withAuth, type AuthContext } from '@/src/libs/auth-middleware'

// GET: Fetch single fasilitas by ID
async function handleGet(req: NextRequest, { user, params }: AuthContext & { params: { id: string } }) {
  try {
    const fasilitas = await prisma.fasilitasAset.findUnique({
      where: {
        id: params.id
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

    if (!fasilitas) {
      return NextResponse.json({ error: 'Fasilitas not found' }, { status: 404 })
    }

    return NextResponse.json(fasilitas)
  } catch (error) {
    console.error('Error fetching fasilitas:', error)

    return NextResponse.json({ error: 'Failed to fetch fasilitas' }, { status: 500 })
  }
}

// PUT: Update fasilitas
async function handlePut(req: NextRequest, { user, params }: AuthContext & { params: { id: string } }) {
  try {
    const body = await req.json()
    const { nama, iconId } = body

    if (!nama || !iconId) {
      return NextResponse.json({ error: 'nama and iconId are required' }, { status: 400 })
    }

    const fasilitas = await prisma.fasilitasAset.update({
      where: {
        id: params.id
      },
      data: {
        nama,
        iconId
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

    return NextResponse.json(fasilitas)
  } catch (error) {
    console.error('Error updating fasilitas:', error)

    return NextResponse.json({ error: 'Failed to update fasilitas' }, { status: 500 })
  }
}

// DELETE: Delete fasilitas
async function handleDelete(req: NextRequest, { user, params }: AuthContext & { params: { id: string } }) {
  try {
    await prisma.fasilitasAset.delete({
      where: {
        id: params.id
      }
    })

    return NextResponse.json({ message: 'Fasilitas berhasil dihapus' })
  } catch (error) {
    console.error('Error deleting fasilitas:', error)

    return NextResponse.json({ error: 'Failed to delete fasilitas' }, { status: 500 })
  }
}

export const GET = withAuth(handleGet)
export const PUT = withAuth(handlePut)
export const DELETE = withAuth(handleDelete)
