import { NextResponse } from 'next/server'

import prisma from '@/src/libs/prisma'

// POST /api/admin/seed-kalender - Insert Kalender menu
export async function POST() {
  try {
    const existing = await prisma.menu.findFirst({
      where: { nama: 'Kalender' }
    })

    if (existing) {
      return NextResponse.json({ message: 'Menu Kalender sudah ada', data: existing })
    }

    const menu = await prisma.menu.create({
      data: {
        nama: 'Kalender',
        keterangan: 'Kalender jadwal booking item aset',
        path: '/kalender',
        icon: 'tabler-calendar',
        urutan: 5,
        parentId: null,
        status: true
      }
    })

    return NextResponse.json({ message: 'Menu Kalender berhasil ditambahkan', data: menu }, { status: 201 })
  } catch (error) {
    console.error('Seed kalender error:', error)

    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
