import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import prisma from '@/src/libs/prisma'

// GET /api/invitation/verify?token=xxx - Verify invitation token
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json({ message: 'Token wajib diisi' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { invitationToken: token },
      select: {
        id: true,
        email: true,
        invitationExpiry: true,
        verifikasi: true,
        company: {
          select: {
            nama: true
          }
        },
        role: {
          select: {
            nama: true
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json({ message: 'Token undangan tidak valid' }, { status: 404 })
    }

    if (user.verifikasi) {
      return NextResponse.json({ message: 'Undangan sudah diterima' }, { status: 400 })
    }

    if (user.invitationExpiry && new Date() > user.invitationExpiry) {
      return NextResponse.json({ message: 'Undangan sudah kadaluarsa' }, { status: 400 })
    }

    return NextResponse.json({
      data: {
        email: user.email,
        company: user.company?.nama || 'Unknown Company',
        role: user.role?.nama || 'Unknown Role'
      },
      message: 'Token valid'
    })
  } catch (error) {
    console.error('Verify invitation error:', error)

    return NextResponse.json({ message: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
