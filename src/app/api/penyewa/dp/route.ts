import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import prisma from '@/src/libs/prisma'
import { withAuth, type AuthContext } from '@/src/libs/auth-middleware'

async function handleGet(request: NextRequest, { user }: AuthContext) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''

    const where: any = user.companyId ? { companyId: user.companyId } : { createdById: user.id }

    if (search) {
      where.OR = [
        { nama: { contains: search.trim(), mode: 'insensitive' } },
        { nomorTelepon: { contains: search.trim(), mode: 'insensitive' } },
        { email: { contains: search.trim(), mode: 'insensitive' } }
      ]
    }

    const data = await prisma.penyewa.findMany({
      where,
      select: { id: true, nama: true, nomorTelepon: true, email: true, status: true },
      orderBy: { nama: 'asc' },
      take: 50
    })

    return NextResponse.json({ data, message: 'Data berhasil diambil' })
  } catch (error) {
    console.error('Get penyewa dp error:', error)

    return NextResponse.json({ message: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

export const GET = withAuth(handleGet)
