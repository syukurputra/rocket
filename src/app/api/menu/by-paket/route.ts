import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import prisma from '@/src/libs/prisma'
import { withAuth, type AuthContext } from '@/src/libs/auth-middleware'

// GET /api/menu/by-paket - Get menus available in company's paket
async function handleGet(request: NextRequest, { user }: AuthContext) {
  try {
    // Get user's company with paket
    const company = await prisma.company.findUnique({
      where: { id: user.companyId! },
      select: {
        paketId: true
      }
    })

    if (!company || !company.paketId) {
      return NextResponse.json({ message: 'Company does not have an active paket' }, { status: 400 })
    }

    // Get menus from paket_menu
    const paketMenus = await prisma.paketMenu.findMany({
      where: {
        paketId: company.paketId
      },
      include: {
        menu: {
          select: {
            id: true,
            nama: true,
            path: true,
            icon: true,
            urutan: true,
            parentId: true,
            status: true
          }
        }
      },
      orderBy: {
        menu: {
          urutan: 'asc'
        }
      }
    })

    // Extract menu data
    const menus = paketMenus.map(pm => pm.menu)

    return NextResponse.json({
      data: menus,
      message: 'Menus retrieved successfully'
    })
  } catch (error) {
    console.error('Get menus by paket error:', error)

    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

export const GET = withAuth(handleGet)
