import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import prisma from '@/src/libs/prisma'
import { withAuth, type AuthContext } from '@/src/libs/auth-middleware'

// PATCH /api/notifikasi/read-all - Tandai semua notifikasi user sudah dibaca
async function handlePatch(_request: NextRequest, { user }: AuthContext) {
  try {
    await prisma.notifikasi.updateMany({
      where: { userId: user.id, read: false },
      data: { read: true }
    })

    return NextResponse.json({ message: 'Semua notifikasi ditandai sudah dibaca' })
  } catch (error) {
    console.error('Read all notifikasi error:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

export const PATCH = withAuth(handlePatch)
