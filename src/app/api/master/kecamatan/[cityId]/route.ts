import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/src/libs/prisma'

export async function GET(req: NextRequest, { params }: { params: Promise<{ cityId: string }> }) {
  try {
    const { cityId } = await params
    const data = await prisma.masterKecamatan.findMany({
      where: { cityId },
      orderBy: { name: 'asc' }
    })
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch districts' }, { status: 500 })
  }
}
