import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import prisma from '@/src/libs/prisma'
import { withAuth, type AuthContext } from '@/src/libs/auth-middleware'

// GET /api/menu - List menus
async function handleGet(request: NextRequest, { user }: AuthContext) {
  try {
    const menus = await prisma.menu.findMany({
      where: {
        OR: [{ companyId: user.companyId }, { companyId: null }] // Global menus or company-specific
      },
      orderBy: [{ urutan: 'asc' }, { nama: 'asc' }],
      include: {
        children: true
      }
    })

    return NextResponse.json({
      data: menus,
      message: 'Menus retrieved successfully'
    })
  } catch (error) {
    console.error('Get menus error:', error)

    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/menu - Create new menu
async function handlePost(request: NextRequest, { user }: AuthContext) {
  try {
    const body = await request.json()
    const { nama, path, icon, urutan = 0, parentId, status = true } = body

    if (!nama) {
      return NextResponse.json({ message: 'Menu name is required' }, { status: 400 })
    }

    const menu = await prisma.menu.create({
      data: {
        nama,
        path,
        icon,
        urutan,
        parentId,
        status,
        companyId: user.companyId
      }
    })

    return NextResponse.json(
      {
        data: menu,
        message: 'Menu created successfully'
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Create menu error:', error)

    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

export const GET = withAuth(handleGet)
export const POST = withAuth(handlePost)
