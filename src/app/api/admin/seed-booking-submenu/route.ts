import { NextResponse } from 'next/server'

import prisma from '@/src/libs/prisma'

// POST /api/admin/seed-booking-submenu
// Membuat sub-menu "Booking Saya" dan "Booking Aset" di bawah menu "Booking"
// Juga update path menu Booking menjadi null (jadi parent dropdown)
// Kemudian assign ke semua role yang sudah punya menu Booking
export async function POST() {
  const results: string[] = []

  try {
    // Cari menu Booking
    const bookingMenu = await prisma.menu.findFirst({
      where: { nama: 'Booking', parentId: null }
    })

    if (!bookingMenu) {
      return NextResponse.json({ message: 'Menu Booking tidak ditemukan' }, { status: 404 })
    }

    results.push(`Menu Booking ditemukan: ${bookingMenu.id}`)

    // Update Booking menu path menjadi null (jadi parent dropdown tanpa link)
    await prisma.menu.update({
      where: { id: bookingMenu.id },
      data: { path: null }
    })
    results.push('Path menu Booking diset null (menjadi parent dropdown)')

    // Buat atau cari sub-menu Booking Saya
    let bookingSaya = await prisma.menu.findFirst({
      where: { nama: 'Booking Saya', parentId: bookingMenu.id }
    })

    if (!bookingSaya) {
      bookingSaya = await prisma.menu.create({
        data: {
          nama: 'Booking Saya',
          keterangan: 'Daftar booking berdasarkan akun penyewa',
          path: '/booking/saya',
          icon: 'tabler-user-check',
          urutan: 1,
          parentId: bookingMenu.id,
          status: true
        }
      })
      results.push(`Sub-menu "Booking Saya" dibuat: ${bookingSaya.id}`)
    } else {
      results.push(`Sub-menu "Booking Saya" sudah ada: ${bookingSaya.id}`)
    }

    // Buat atau cari sub-menu Booking Aset
    let bookingAset = await prisma.menu.findFirst({
      where: { nama: 'Booking Aset', parentId: bookingMenu.id }
    })

    if (!bookingAset) {
      bookingAset = await prisma.menu.create({
        data: {
          nama: 'Booking Aset',
          keterangan: 'Daftar booking aset berdasarkan perusahaan',
          path: '/booking/aset',
          icon: 'tabler-building-store',
          urutan: 2,
          parentId: bookingMenu.id,
          status: true
        }
      })
      results.push(`Sub-menu "Booking Aset" dibuat: ${bookingAset.id}`)
    } else {
      results.push(`Sub-menu "Booking Aset" sudah ada: ${bookingAset.id}`)
    }

    // Cari semua role yang punya menu Booking
    const rolesWithBooking = await prisma.menuRole.findMany({
      where: { menuId: bookingMenu.id },
      select: { roleId: true }
    })

    results.push(`Role yang punya Booking: ${rolesWithBooking.length}`)

    let assigned = 0

    for (const { roleId } of rolesWithBooking) {
      const existingMenuRoles = await prisma.menuRole.findMany({
        where: { roleId, menuId: { in: [bookingSaya.id, bookingAset.id] } }
      })

      const existingIds = new Set(existingMenuRoles.map(mr => mr.menuId))

      if (!existingIds.has(bookingSaya.id)) {
        await prisma.menuRole.create({ data: { roleId, menuId: bookingSaya.id } })
        assigned++
      }

      if (!existingIds.has(bookingAset.id)) {
        await prisma.menuRole.create({ data: { roleId, menuId: bookingAset.id } })
        assigned++
      }
    }

    results.push(`Total menuRole ditambahkan: ${assigned}`)

    // Juga tambahkan ke semua paketMenu yang punya Booking
    const paketsWithBooking = await prisma.paketMenu.findMany({
      where: { menuId: bookingMenu.id },
      select: { paketId: true, tampilkan: true }
    })

    results.push(`Paket yang punya Booking: ${paketsWithBooking.length}`)

    let paketAssigned = 0

    for (const { paketId, tampilkan } of paketsWithBooking) {
      const existingPaketMenus = await prisma.paketMenu.findMany({
        where: { paketId, menuId: { in: [bookingSaya.id, bookingAset.id] } }
      })

      const existingIds = new Set(existingPaketMenus.map(pm => pm.menuId))

      if (!existingIds.has(bookingSaya.id)) {
        await prisma.paketMenu.create({ data: { paketId, menuId: bookingSaya.id, tampilkan } })
        paketAssigned++
      }

      if (!existingIds.has(bookingAset.id)) {
        await prisma.paketMenu.create({ data: { paketId, menuId: bookingAset.id, tampilkan } })
        paketAssigned++
      }
    }

    results.push(`Total paketMenu ditambahkan: ${paketAssigned}`)

    return NextResponse.json({ message: 'Berhasil', results })
  } catch (error) {
    console.error('Seed booking submenu error:', error)

    return NextResponse.json({ message: 'Terjadi kesalahan server', error: String(error) }, { status: 500 })
  }
}

export async function GET() {
  try {
    const bookingMenu = await prisma.menu.findFirst({
      where: { nama: 'Booking' },
      include: { children: true }
    })

    return NextResponse.json({ data: bookingMenu })
  } catch (error) {
    return NextResponse.json({ message: 'Error', error: String(error) }, { status: 500 })
  }
}
