import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/src/libs/prisma'

export async function GET(req: NextRequest, { params }: { params: Promise<{ provinceId: string }> }) {
  try {
    const { provinceId } = await params
    const data = await prisma.masterKota.findMany({
      where: { provinceId },
      orderBy: { name: 'asc' }
    })
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch cities' }, { status: 500 })
  }
}
