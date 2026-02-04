import { NextResponse } from 'next/server'
import prisma from '@/src/libs/prisma'

export async function GET() {
  try {
    const icons = await prisma.masterIcon.findMany({
      select: {
        id: true,
        nama: true,
        code: true
      },
      orderBy: {
        nama: 'asc'
      }
    })

    return NextResponse.json(icons)
  } catch (error) {
    console.error('Error fetching icons:', error)

    return NextResponse.json({ error: 'Failed to fetch icons' }, { status: 500 })
  }
}
