import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/src/libs/prisma'
import { extractTokenFromRequest, verifyAccessToken } from '@/src/libs/jwt'

export async function GET(request: NextRequest) {
  try {
    const token = extractTokenFromRequest(request)

    if (!token) {
      return NextResponse.json(
        { message: 'Access token required' },
        { status: 401 }
      )
    }

    const payload = verifyAccessToken(token)

    if (!payload) {
      return NextResponse.json(
        { message: 'Invalid or expired token' },
        { status: 401 }
      )
    }

    const asetId = payload.asetId

    console.log("aset id : " + asetId)

    const { searchParams } = new URL(request.url)
    const asetIdFilter = searchParams.get('asetId') // Get jenis filter from query params
    const where: any = {}

    if (asetIdFilter) {
      where.asetId = asetIdFilter
    }

    const [data] = await Promise.all([
      prisma.ruangan.findMany({
        where,
        select: {
          id: true,
          nama: true,
          asetId: true
        },
        orderBy: { nama: 'desc' }
      }),
    ])

    return NextResponse.json({
      data,
      message: 'Data retrieved successfully'
    })

  } catch (error) {
    console.error('Get ruangan error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
