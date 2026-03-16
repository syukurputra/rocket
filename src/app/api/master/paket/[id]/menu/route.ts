import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import prisma from '@/src/libs/prisma'
import { withAuth, type AuthContext } from '@/src/libs/auth-middleware'

// GET /api/master/paket/[id]/menu - Get menus for a paket
async function handleGet(request: NextRequest, { params }: AuthContext & { params: { id: string } }) {
  try {
    // Verify paket exists
    const paket = await prisma.masterPaket.findUnique({
      where: { id: params.id },
      include: {
        paketMenus: {
          include: {
            menu: true
          }
        }
      }
    })

    if (!paket) {
      return NextResponse.json({ message: 'Paket not found' }, { status: 404 })
    }

    // Get all menus
    const allMenus = await prisma.menu.findMany({
      where: { status: true },
      orderBy: [{ urutan: 'asc' }, { nama: 'asc' }]
    })

    // Create a map of assigned menu IDs to their descriptions for quick lookup
    const assignedMenuData = new Map(
      (paket.paketMenus as any[]).map(pm => [
        pm.menuId, 
        { deskripsi: pm.deskripsi, tampilkan: pm.tampilkan }
      ])
    )

    // Map menus with assignment status
    const menusWithStatus = allMenus.map(menu => ({
      id: menu.id,
      nama: menu.nama,
      path: menu.path,
      icon: menu.icon,
      isAssigned: assignedMenuData.has(menu.id),
      deskripsi: assignedMenuData.get(menu.id)?.deskripsi || null,
      tampilkan: assignedMenuData.has(menu.id) ? assignedMenuData.get(menu.id)?.tampilkan : true
    }))

    return NextResponse.json({
      data: {
        paket: {
          id: paket.id,
          nama: paket.nama
        },
        menus: menusWithStatus
      },
      message: 'Menus retrieved successfully'
    })
  } catch (error) {
    console.error('Get paket menus error:', error)

    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/master/paket/[id]/menu - Update paket menus
async function handlePut(request: NextRequest, { params }: AuthContext & { params: { id: string } }) {
  try {
    const body = await request.json()
    const { menus } = body

    if (!Array.isArray(menus)) {
      return NextResponse.json({ message: 'menus must be an array' }, { status: 400 })
    }

    // Verify paket exists
    const paket = await prisma.masterPaket.findUnique({
      where: { id: params.id }
    })

    if (!paket) {
      return NextResponse.json({ message: 'Paket not found' }, { status: 404 })
    }

    // Delete existing paket_menu entries and create new ones in a transaction
    await prisma.$transaction(async tx => {
      // Delete all existing menu assignments for this paket
      await tx.paketMenu.deleteMany({
        where: { paketId: params.id }
      })

      // Create new menu assignments
      if (menus.length > 0) {
        await tx.paketMenu.createMany({
          data: menus.map((menu: { id: string; deskripsi: string | null; tampilkan: boolean }) => ({
            paketId: params.id,
            menuId: menu.id,
            deskripsi: menu.deskripsi || null,
            tampilkan: menu.tampilkan !== undefined ? menu.tampilkan : true
          }))
        })
      }
    })

    return NextResponse.json({
      message: 'Paket menus updated successfully'
    })
  } catch (error) {
    console.error('Update paket menus error:', error)

    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

export const GET = withAuth(handleGet)
export const PUT = withAuth(handlePut)
