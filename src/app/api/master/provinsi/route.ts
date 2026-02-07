import { NextResponse } from 'next/server'
import prisma from '@/src/libs/prisma'

export async function GET() {
  try {
    const data = await prisma.masterProvinsi.findMany({
      orderBy: { name: 'asc' }
    })
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch provinces' }, { status: 500 })
  }
}
