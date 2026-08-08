import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import prisma from '@/src/libs/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''

    // Wajib minimal 2 karakter
    if (search.trim().length < 2) {
      return NextResponse.json([])
    }

    const icons = await prisma.masterIcon.findMany({
      where: {
        OR: [
          { nama: { contains: search.trim(), mode: 'insensitive' } },
          { code: { contains: search.trim(), mode: 'insensitive' } },

          // Kata kunci bahasa Indonesia, mis. "bangku" menemukan ikon armchair
          { keyword: { contains: search.trim(), mode: 'insensitive' } }
        ]
      },
      select: { id: true, nama: true, code: true, keyword: true },
      orderBy: { nama: 'asc' },
      take: 50
    })

    return NextResponse.json(icons)
  } catch (error) {
    console.error('Error fetching icons:', error)

    return NextResponse.json({ error: 'Failed to fetch icons' }, { status: 500 })
  }
}
