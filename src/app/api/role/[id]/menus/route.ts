import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import prisma from '@/src/libs/prisma'
import { withAuth, type AuthContext } from '@/src/libs/auth-middleware'

// GET /api/role/[id]/menus - Get available menus for role (filtered by company paket)
async function handleGet(request: NextRequest, { params }: AuthContext & { params: { id: string } }) {
  try {
    // Verify role exists and get its company
    const role = await prisma.role.findUnique({
      where: { id: params.id },
      include: {
        company: {
          include: {
            paket: {
              include: {
                paketMenus: {
                  include: {
                    menu: true
                  }
                }
              }
            }
          }
        },
        menuRoles: true
      }
    })

    if (!role) {
      return NextResponse.json({ message: 'Role not found' }, { status: 404 })
    }

    // Get menus from company's paket
    const paketMenus = role.company?.paket?.paketMenus || []

    if (paketMenus.length === 0) {
      return NextResponse.json({
        data: [],
        message: 'No menus available in company paket'
      })
    }

    // Get menu IDs from paket
    const availableMenus = paketMenus.map(pm => pm.menu)

    // Create set of assigned menu IDs
    const assignedMenuIds = new Set(role.menuRoles.map((rm: any) => rm.menuId))

    // Map menus with assignment status
    const menusWithAssignment = availableMenus.map(menu => ({
      id: menu.id,
      nama: menu.nama,
      path: menu.path,
      icon: menu.icon,
      assigned: assignedMenuIds.has(menu.id)
    }))

    return NextResponse.json({
      data: menusWithAssignment,
      message: 'Menus retrieved successfully'
    })
  } catch (error) {
    console.error('Get role menus error:', error)

    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/role/[id]/menus - Assign menus to role
async function handlePut(request: NextRequest, { user, params }: AuthContext & { params: { id: string } }) {
  try {
    const body = await request.json()
    const { menus } = body

    if (!Array.isArray(menus)) {
      return NextResponse.json({ message: 'Menus must be an array' }, { status: 400 })
    }

    if (!user.companyId) {
      return NextResponse.json({ message: 'User tidak terkait dengan perusahaan' }, { status: 400 })
    }

    // Verify role exists
    const role = await prisma.role.findUnique({
      where: {
        id: params.id
      }
    })

    if (!role) {
      return NextResponse.json({ message: 'Role not found' }, { status: 404 })
    }

    // Delete existing role-menu assignments for this role
    await prisma.menuRole.deleteMany({
      where: {
        roleId: params.id
      }
    })

    // Create new assignments
    if (menus.length > 0) {
      await prisma.menuRole.createMany({
        data: menus.map((menu: any) => ({
          roleId: params.id,
          menuId: menu.menuId
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

export const GET = withAuth(handleGet)
export const PUT = withAuth(handlePut)
