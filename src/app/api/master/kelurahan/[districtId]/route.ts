import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/src/libs/prisma'

export async function GET(req: NextRequest, { params }: { params: Promise<{ districtId: string }> }) {
  try {
    const { districtId } = await params
    const data = await prisma.masterKelurahan.findMany({
      where: { districtId },
      orderBy: { name: 'asc' }
    })
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch villages' }, { status: 500 })
  }
}
