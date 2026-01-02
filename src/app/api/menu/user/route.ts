import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import prisma from '@/src/libs/prisma'
import { withAuth, type AuthContext } from '@/src/libs/auth-middleware'

// GET /api/menu/user - Get user's accessible menus based on role
async function handleGet(request: NextRequest, { user }: AuthContext) {
  try {
    if (!user.roleId) {
      return NextResponse.json({ data: [], message: 'User has no role assigned' })
    }

    const roleMenus = await prisma.roleMenu.findMany({
      where: {
        roleId: user.roleId,
        menu: {
          status: true
        }
      },
      include: {
        menu: {
          include: {
            children: {
              where: {
                status: true
              }
            }
          }
        }
      }
    })

    const menusWithPermissions = roleMenus.map(rm => ({
      menu: rm.menu,
      canCreate: rm.canCreate,
      canRead: rm.canRead,
      canUpdate: rm.canUpdate,
      canDelete: rm.canDelete
    }))

    return NextResponse.json({
      data: menusWithPermissions,
      message: 'User menus retrieved successfully'
    })
  } catch (error) {
    console.error('Get user menus error:', error)

    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

export const GET = withAuth(handleGet)
