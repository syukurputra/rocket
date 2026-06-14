import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import prisma from '@/src/libs/prisma'
import { withAuth, type AuthContext } from '@/src/libs/auth-middleware'

// GET /api/role/[id] - Get role by ID
async function handleGet(request: NextRequest, { user, params }: AuthContext & { params: { id: string } }) {
  try {
    console.log('GET /api/role/[id] - Params:', params)
    console.log('GET /api/role/[id] - User:', { id: user.id, companyId: user.companyId })

    const role = await prisma.role.findUnique({
      where: {
        id: params.id
      },
      include: {
        company: true,
        menuRoles: {
          include: {
            menu: true
          }
        }
      }
    })

    console.log('GET /api/role/[id] - Role found:', role ? 'Yes' : 'No')

    if (!role) {
      return NextResponse.json({ message: 'Role tidak ditemukan' }, { status: 404 })
    }

    return NextResponse.json({
      data: role,
      message: 'Data role berhasil diambil'
    })
  } catch (error) {
    console.error('Get role error:', error)

    return NextResponse.json({ message: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

// PUT /api/role/[id] - Update role
async function handlePut(request: NextRequest, { user, params }: AuthContext & { params: { id: string } }) {
  try {
    const body = await request.json()
    const { nama, deskripsi, status } = body

    const role = await prisma.role.update({
      where: {
        id: params.id
      },
      data: {
        ...(nama && { nama }),
        ...(deskripsi !== undefined && { deskripsi }),
        ...(status !== undefined && { status })
      }
    })

    return NextResponse.json({
      data: role,
      message: 'Role berhasil diperbarui'
    })
  } catch (error) {
    console.error('Update role error:', error)

    return NextResponse.json({ message: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

// DELETE /api/role/[id] - Delete role
async function handleDelete(request: NextRequest, { user, params }: AuthContext & { params: { id: string } }) {
  try {
    await prisma.role.delete({
      where: {
        id: params.id
      }
    })

    return NextResponse.json({
      message: 'Role berhasil dihapus'
    })
  } catch (error) {
    console.error('Delete role error:', error)

    return NextResponse.json({ message: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

export const GET = withAuth(handleGet)
export const PUT = withAuth(handlePut)
export const DELETE = withAuth(handleDelete)
