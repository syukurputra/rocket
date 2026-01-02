import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import prisma from '@/src/libs/prisma'
import { withAuth, type AuthContext } from '@/src/libs/auth-middleware'

// PUT /api/role/[id]/menu - Assign menus to role
async function handlePut(request: NextRequest, { user, params }: AuthContext & { params: { id: string } }) {
  try {
    const body = await request.json()
    const { menus } = body // Array of { menuId, canCreate, canRead, canUpdate, canDelete }

    if (!Array.isArray(menus)) {
      return NextResponse.json({ message: 'Menus must be an array' }, { status: 400 })
    }

    // Verify role belongs to user's company
    const role = await prisma.role.findFirst({
      where: {
        id: params.id,
        companyId: user.companyId || undefined
      }
    })

    if (!role) {
      return NextResponse.json({ message: 'Role not found or unauthorized' }, { status: 404 })
    }

    // Delete existing role-menu assignments
    await prisma.roleMenu.deleteMany({
      where: {
        roleId: params.id
      }
    })

    // Create new assignments
    if (menus.length > 0) {
      await prisma.roleMenu.createMany({
        data: menus.map(menu => ({
          roleId: params.id,
          menuId: menu.menuId,
          canCreate: menu.canCreate || false,
          canRead: menu.canRead !== false, // Default to true
          canUpdate: menu.canUpdate || false,
          canDelete: menu.canDelete || false
        }))
      })
    }

    return NextResponse.json({
      message: 'Role menus updated successfully'
    })
  } catch (error) {
    console.error('Update role menus error:', error)

    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

export const PUT = withAuth(handlePut)
