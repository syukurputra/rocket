import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import prisma from '@/src/libs/prisma'
import { withAuth, type AuthContext } from '@/src/libs/auth-middleware'

// PUT /api/role/[id]/menu - Assign menus to role
async function handlePut(request: NextRequest, { user, params }: AuthContext & { params: { id: string } }) {
  try {
    const body = await request.json()
    const { menus } = body // Array of { menuId }

    if (!Array.isArray(menus)) {
      return NextResponse.json({ message: 'Menus harus berupa array' }, { status: 400 })
    }

    // Verify role belongs to user's company
    const role = await prisma.role.findFirst({
      where: {
        id: params.id,
        companyId: user.companyId || undefined
      }
    })

    if (!role) {
      return NextResponse.json({ message: 'Role tidak ditemukan atau akses tidak diizinkan' }, { status: 404 })
    }

    // Delete existing role-menu assignments
    await prisma.menuRole.deleteMany({
      where: {
        roleId: params.id
      }
    })

    // Create new assignments
    if (menus.length > 0) {
      await prisma.menuRole.createMany({
        data: menus.map(menu => ({
          roleId: params.id,
          menuId: menu.menuId
        }))
      })
    }

    return NextResponse.json({
      message: 'Menu role berhasil diperbarui'
    })
  } catch (error) {
    console.error('Update role menus error:', error)

    return NextResponse.json({ message: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

export const PUT = withAuth(handlePut)
