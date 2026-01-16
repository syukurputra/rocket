import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import prisma from '@/src/libs/prisma'
import { withAuth, type AuthContext } from '@/src/libs/auth-middleware'

// GET /api/menu/[id] - Get menu by ID
async function handleGet(request: NextRequest, { user, params }: AuthContext & { params: { id: string } }) {
  try {
    const menu = await prisma.menu.findUnique({
      where: { id: params.id },
      include: {
        parent: true,
        children: true
      }
    })

    if (!menu) {
      return NextResponse.json({ message: 'Menu not found' }, { status: 404 })
    }

    return NextResponse.json({
      data: menu,
      message: 'Menu retrieved successfully'
    })
  } catch (error) {
    console.error('Get menu error:', error)

    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/menu/[id] - Update menu
async function handlePut(request: NextRequest, { user, params }: AuthContext & { params: { id: string } }) {
  try {
    const body = await request.json()
    const { nama, path, icon, urutan, parentId, status } = body

    if (!nama) {
      return NextResponse.json({ message: 'Menu name is required' }, { status: 400 })
    }

    const menu = await prisma.menu.update({
      where: { id: params.id },
      data: {
        nama,
        path: path || null,
        icon: icon || null,
        urutan: urutan !== undefined ? Number(urutan) : undefined,
        parentId: parentId || null,
        status: status !== undefined ? Boolean(status) : undefined
      }
    })

    return NextResponse.json({
      data: menu,
      message: 'Menu updated successfully'
    })
  } catch (error) {
    console.error('Update menu error:', error)

    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/menu/[id] - Delete menu
async function handleDelete(request: NextRequest, { user, params }: AuthContext & { params: { id: string } }) {
  try {
    // Check if menu has children
    const menuWithChildren = await prisma.menu.findUnique({
      where: { id: params.id },
      include: {
        children: true
      }
    })

    if (!menuWithChildren) {
      return NextResponse.json({ message: 'Menu not found' }, { status: 404 })
    }

    if (menuWithChildren.children.length > 0) {
      return NextResponse.json(
        { message: 'Cannot delete menu with sub-menus. Please delete sub-menus first.' },
        { status: 400 }
      )
    }

    await prisma.menu.delete({
      where: { id: params.id }
    })

    return NextResponse.json({
      message: 'Menu deleted successfully'
    })
  } catch (error) {
    console.error('Delete menu error:', error)

    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

export const GET = withAuth(handleGet)
export const PUT = withAuth(handlePut)
export const DELETE = withAuth(handleDelete)
