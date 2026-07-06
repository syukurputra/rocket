import { NextResponse } from 'next/server'
import prisma from '@/src/libs/prisma'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const email = searchParams.get('email') || 'syukurniyadi.putra@gmail.com'
  const user = await prisma.user.findFirst({
    where: { email },
    include: {
      role: { include: { menuRoles: { include: { menu: { select: { id: true, nama: true, parentId: true } } } } } },
      company: { include: { paket: { select: { id: true, nama: true } } } }
    }
  })
  if (!user) return NextResponse.json({ message: 'User tidak ditemukan' }, { status: 404 })
  return NextResponse.json({
    user: { id: user.id, username: user.username, email: user.email },
    company: user.company ? { id: user.company.id, nama: (user.company as any).nama, paket: user.company.paket } : null,
    role: user.role ? { id: user.role.id, nama: user.role.nama, menus: user.role.menuRoles.map((mr: any) => ({ nama: mr.menu.nama, parentId: mr.menu.parentId })) } : null
  })
}

export async function POST(request: Request) {
  const results: string[] = []
  const { searchParams } = new URL(request.url)
  const roleId = searchParams.get('roleId')

  if (roleId) {
    // Fix specific role: tambah Setting + Booking
    const targetMenuNames = ['Setting', 'Booking']
    const targetMenus = await prisma.menu.findMany({
      where: { nama: { in: targetMenuNames }, status: true }
    })
    results.push(`Menu ditemukan: ${targetMenus.map((m: any) => m.nama).join(', ')}`)

    const existingMenuRoles = await prisma.menuRole.findMany({ where: { roleId } })
    const existingIds = new Set(existingMenuRoles.map((mr: any) => mr.menuId))

    for (const menu of targetMenus) {
      if (!existingIds.has(menu.id)) {
        await prisma.menuRole.create({ data: { roleId, menuId: menu.id } })
        results.push(`Assigned: ${menu.nama} ke role ${roleId}`)
      } else {
        results.push(`Sudah ada: ${menu.nama}`)
      }
    }
    return NextResponse.json({ message: 'Berhasil', results })
  }

  // Default: fix semua company paket free
  const paketFree = await prisma.masterPaket.findFirst({
    where: { nama: { contains: 'free', mode: 'insensitive' } },
    include: { paketMenus: true }
  })
  if (!paketFree) return NextResponse.json({ message: 'Paket free tidak ditemukan' }, { status: 404 })
  results.push(`Paket free: ${paketFree.nama} (${paketFree.id})`)

  const targetMenus = await prisma.menu.findMany({
    where: { OR: [{ nama: { contains: 'invoice', mode: 'insensitive' } }, { nama: { contains: 'booking', mode: 'insensitive' } }, { nama: { equals: 'Setting' } }], status: true }
  })
  results.push(`Menu target: ${targetMenus.map((m: any) => m.nama).join(', ')}`)

  const existingPaketMenuIds = new Set(paketFree.paketMenus.map((pm: any) => pm.menuId))
  for (const menu of targetMenus) {
    if (!existingPaketMenuIds.has(menu.id)) {
      await prisma.paketMenu.create({ data: { paketId: paketFree.id, menuId: menu.id, tampilkan: true } })
      results.push(`Ditambahkan ke paket: ${menu.nama}`)
    } else {
      results.push(`Sudah ada di paket: ${menu.nama}`)
    }
  }

  const companies = await prisma.company.findMany({
    where: { paketId: paketFree.id },
    include: { roles: { include: { menuRoles: true } } }
  })
  results.push(`Company: ${companies.length}`)
  let assigned = 0
  for (const company of companies) {
    for (const role of company.roles) {
      const existing = new Set(role.menuRoles.map((rm: any) => rm.menuId))
      for (const menu of targetMenus) {
        if (!existing.has(menu.id)) {
          await prisma.menuRole.create({ data: { roleId: role.id, menuId: menu.id } })
          assigned++
        }
      }
    }
  }
  results.push(`Assigned: ${assigned}`)
  return NextResponse.json({ message: 'Berhasil', results })
}
