import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/src/libs/prisma'
import { extractTokenFromRequest, verifyAccessToken } from '@/src/libs/jwt'

export async function GET(request: NextRequest) {
  try {
    // Verify JWT token
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

    const userId = payload.userId

    const { searchParams } = new URL(request.url)

    // Build where condition
    const where = {
      createdById: userId
    }

    // Fetch data dengan relations
    const [data] = await Promise.all([
      prisma.aset.findMany({
        where,
        select: {
          id: true,
          nama: true,
          jenis: true
        },
        orderBy: { nama: 'desc' }
      }),
    ])

    return NextResponse.json({
      data,
      message: 'Data retrieved successfully'
    })

  } catch (error) {
    console.error('Get aset error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
