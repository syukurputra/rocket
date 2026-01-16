import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import prisma from '@/src/libs/prisma'
import { withAuth, type AuthContext } from '@/src/libs/auth-middleware'

// GET /api/role - List roles for user's company
async function handleGet(request: NextRequest, { user }: AuthContext) {
  try {
    // Super admin can access all roles
    const isSuperAdmin = user.role?.nama === 'SUPER ADMIN'

    if (!isSuperAdmin && !user.companyId) {
      return NextResponse.json({ message: 'User not assigned to any company' }, { status: 400 })
    }

    const roles = await prisma.role.findMany({
      where: isSuperAdmin
        ? {}
        : {
            companyId: user.companyId
          },
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        _count: {
          select: {
            users: true
          }
        }
      }
    })

    return NextResponse.json({
      data: roles,
      message: 'Roles retrieved successfully'
    })
  } catch (error) {
    console.error('Get roles error:', error)

    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/role - Create new role
async function handlePost(request: NextRequest, { user }: AuthContext) {
  try {
    // Super admin can create roles for any company
    const isSuperAdmin = user.role?.nama === 'SUPER ADMIN'

    if (!isSuperAdmin && !user.companyId) {
      return NextResponse.json({ message: 'User not assigned to any company' }, { status: 400 })
    }

    const body = await request.json()
    const { nama, deskripsi, status = true } = body

    if (!nama) {
      return NextResponse.json({ message: 'Role name is required' }, { status: 400 })
    }

    const role = await prisma.role.create({
      data: {
        nama,
        deskripsi,
        status,
        companyId: user.companyId
      }
    })

    return NextResponse.json(
      {
        data: role,
        message: 'Role created successfully'
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Create role error:', error)

    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

export const GET = withAuth(handleGet)
export const POST = withAuth(handlePost)
