import { NextResponse } from 'next/server'

import prisma from '@/src/libs/prisma'

// POST /api/admin/seed-menu - Insert Konfirmasi Pembayaran menu under Management
// Call this once to seed the menu item into the database
export async function POST() {
  try {
    // Find the Management parent menu
    const managementMenu = await prisma.menu.findFirst({
      where: { nama: 'Management', parentId: null }
    })

    if (!managementMenu) {
      return NextResponse.json({ message: 'Menu Management tidak ditemukan' }, { status: 404 })
    }

    // Check if already exists
    const existing = await prisma.menu.findFirst({
      where: { nama: 'Konfirmasi Pembayaran', parentId: managementMenu.id }
    })

    if (existing) {
      return NextResponse.json({ message: 'Menu sudah ada', data: existing })
    }

    const menu = await prisma.menu.create({
      data: {
        nama: 'Konfirmasi Pembayaran',
        keterangan: 'Kelola konfirmasi pembayaran invoice',
        path: '/management-master/konfirmasi-pembayaran',
        icon: 'tabler-credit-card-pay',
        urutan: 99,
        parentId: managementMenu.id,
        status: true
      }
    })

    return NextResponse.json({ message: 'Menu berhasil ditambahkan', data: menu }, { status: 201 })
  } catch (error) {
    console.error('Seed menu error:', error)

    return NextResponse.json({ message: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
