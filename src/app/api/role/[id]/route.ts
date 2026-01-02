import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import prisma from '@/src/libs/prisma'
import { withAuth, type AuthContext } from '@/src/libs/auth-middleware'

// GET /api/role/[id] - Get role by ID
async function handleGet(request: NextRequest, { user, params }: AuthContext & { params: { id: string } }) {
  try {
    const role = await prisma.role.findFirst({
      where: {
        id: params.id,
        companyId: user.companyId || undefined
      },
      include: {
        roleMenus: {
          include: {
            menu: true
          }
        }
      }
    })

    if (!role) {
      return NextResponse.json({ message: 'Role not found' }, { status: 404 })
    }

    return NextResponse.json({
      data: role,
      message: 'Role retrieved successfully'
    })
  } catch (error) {
    console.error('Get role error:', error)

    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/role/[id] - Update role
async function handlePut(request: NextRequest, { user, params }: AuthContext & { params: { id: string } }) {
  try {
    const body = await request.json()
    const { nama, deskripsi, status } = body

    const role = await prisma.role.updateMany({
      where: {
        id: params.id,
        companyId: user.companyId || undefined
      },
      data: {
        ...(nama && { nama }),
        ...(deskripsi !== undefined && { deskripsi }),
        ...(status !== undefined && { status })
      }
    })

    if (role.count === 0) {
      return NextResponse.json({ message: 'Role not found or unauthorized' }, { status: 404 })
    }

    return NextResponse.json({
      message: 'Role updated successfully'
    })
  } catch (error) {
    console.error('Update role error:', error)

    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/role/[id] - Delete role
async function handleDelete(request: NextRequest, { user, params }: AuthContext & { params: { id: string } }) {
  try {
    const deleted = await prisma.role.deleteMany({
      where: {
        id: params.id,
        companyId: user.companyId || undefined
      }
    })

    if (deleted.count === 0) {
      return NextResponse.json({ message: 'Role not found or unauthorized' }, { status: 404 })
    }

    return NextResponse.json({
      message: 'Role deleted successfully'
    })
  } catch (error) {
    console.error('Delete role error:', error)

    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

export const GET = withAuth(handleGet)
export const PUT = withAuth(handlePut)
export const DELETE = withAuth(handleDelete)
