import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import prisma from '@/src/libs/prisma'
import { withAuth, type AuthContext } from '@/src/libs/auth-middleware'

// GET /api/keranjang/count — jumlah item di keranjang, untuk badge di header
async function handleGet(_request: NextRequest, { user }: AuthContext) {
  try {
    const jumlahItem = await prisma.keranjang.count({ where: { userId: user.id } })

    return NextResponse.json({ data: { jumlahItem } })
  } catch (error) {
    console.error('Count keranjang error:', error)

    return NextResponse.json({ data: { jumlahItem: 0 } })
  }
}

export const GET = withAuth(handleGet)
