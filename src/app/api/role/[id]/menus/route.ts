import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import prisma from '@/src/libs/prisma'
import { withAuth, type AuthContext } from '@/src/libs/auth-middleware'
import { ambilMenuIdsUntukCompany, ambilMenuUntukCompany, companyPlatform } from '@/src/libs/menuTenant'

type Ctx = AuthContext & { params: { id: string } }

/**
 * Role hanya boleh diatur oleh pengguna dari company yang sama, kecuali admin
 * platform yang memang mengelola role semua company.
 */
async function bolehAkses(roleCompanyId: string | null, userCompanyId: string | null | undefined) {
  if (roleCompanyId && roleCompanyId === userCompanyId) return true

  return companyPlatform(userCompanyId)
}

// GET /api/role/[id]/menus - Menu yang tersedia untuk role, beserta status penetapannya
async function handleGet(_request: NextRequest, { user, params }: Ctx) {
  try {
    const role = await prisma.role.findUnique({
      where: { id: params.id },
      include: { menuRoles: true }
    })

    if (!role || !(await bolehAkses(role.companyId, user.companyId))) {
      return NextResponse.json({ message: 'Role tidak ditemukan' }, { status: 404 })
    }

    // Bantu Sewa 100% gratis: semua usaha mendapat menu yang sama, tidak lagi
    // bergantung pada paket.
    const availableMenus = await ambilMenuUntukCompany(role.companyId)

    const assignedMenuIds = new Set(role.menuRoles.map(rm => rm.menuId))

    const menusWithAssignment = availableMenus.map(menu => ({
      id: menu.id,
      nama: menu.nama,
      path: menu.path,
      icon: menu.icon,
      assigned: assignedMenuIds.has(menu.id)
    }))

    return NextResponse.json({
      data: menusWithAssignment,
      message: 'Data menu berhasil diambil'
    })
  } catch (error) {
    console.error('Get role menus error:', error)

    return NextResponse.json({ message: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

// PUT /api/role/[id]/menus - Assign menus to role
async function handlePut(request: NextRequest, { user, params }: Ctx) {
  try {
    const body = await request.json()
    const { menus } = body

    if (!Array.isArray(menus)) {
      return NextResponse.json({ message: 'Menus harus berupa array' }, { status: 400 })
    }

    if (!user.companyId) {
      return NextResponse.json({ message: 'User tidak terkait dengan perusahaan' }, { status: 400 })
    }

    const role = await prisma.role.findUnique({ where: { id: params.id } })

    if (!role || !(await bolehAkses(role.companyId, user.companyId))) {
      return NextResponse.json({ message: 'Role tidak ditemukan' }, { status: 404 })
    }

    // Hanya menu yang memang tersedia untuk company role ini yang disimpan —
    // mencegah tenant memberi rolenya menu admin platform.
    const diizinkan = new Set(await ambilMenuIdsUntukCompany(role.companyId))
    const menuIds = [...new Set(menus.map((m: any) => String(m?.menuId ?? '')))].filter(id => diizinkan.has(id))

    await prisma.$transaction([
      prisma.menuRole.deleteMany({ where: { roleId: params.id } }),
      prisma.menuRole.createMany({
        data: menuIds.map(menuId => ({ roleId: params.id, menuId }))
      })
    ])

    return NextResponse.json({
      message: 'Menu berhasil ditetapkan'
    })
  } catch (error) {
    console.error('Assign menus error:', error)

    return NextResponse.json({ message: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

export const GET = withAuth(handleGet)
export const PUT = withAuth(handlePut)
