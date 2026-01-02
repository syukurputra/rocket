import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import prisma from '@/src/libs/prisma'
import { withAuth, type AuthContext } from '@/src/libs/auth-middleware'

// PUT /api/role/[id]/menus - Assign menus to role
async function handlePut(request: NextRequest, { user, params }: AuthContext & { params: { id: string } }) {
  try {
    const body = await request.json()
    const { menus } = body

    if (!Array.isArray(menus)) {
      return NextResponse.json({ message: 'Menus must be an array' }, { status: 400 })
    }

    // Delete existing role-menu assignments
    await prisma.roleMenu.deleteMany({
      where: { roleId: params.id }
    })

    // Create new assignments
    if (menus.length > 0) {
      await prisma.roleMenu.createMany({
        data: menus.map((menu: any) => ({
          roleId: params.id,
          menuId: menu.menuId,
          canCreate: menu.canCreate ?? false,
          canRead: menu.canRead ?? false,
          canUpdate: menu.canUpdate ?? false,
          canDelete: menu.canDelete ?? false
        }))
      })
    }

    return NextResponse.json({
      message: 'Menus assigned successfully'
    })
  } catch (error) {
    console.error('Assign menus error:', error)

    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

export const PUT = withAuth(handlePut)
