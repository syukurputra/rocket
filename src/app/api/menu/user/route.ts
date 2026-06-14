import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import prisma from '@/src/libs/prisma'
import { withAuth, type AuthContext } from '@/src/libs/auth-middleware'

// GET /api/menu/user - Get user's accessible menus based on role
async function handleGet(request: NextRequest, { user }: AuthContext) {
  try {
    if (!user.roleId) {
      return NextResponse.json({ data: [], message: 'User tidak memiliki role' })
    }

    const roleMenus = await prisma.menuRole.findMany({
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

    const menus = roleMenus.map(rm => rm.menu)

    return NextResponse.json({
      data: menus,
      message: 'Data menu user berhasil diambil'
    })
  } catch (error) {
    console.error('Get user menus error:', error)

    return NextResponse.json({ message: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

export const GET = withAuth(handleGet)
