import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import prisma from '@/src/libs/prisma'

// GET /api/invitation/verify?token=xxx - Verify invitation token
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json({ message: 'Token is required' }, { status: 400 })
    }

    // Find user with this invitation token
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
      return NextResponse.json({ message: 'Invalid invitation token' }, { status: 404 })
    }

    // Check if already verified
    if (user.verifikasi) {
      return NextResponse.json({ message: 'Invitation already accepted' }, { status: 400 })
    }

    // Check if expired
    if (user.invitationExpiry && new Date() > user.invitationExpiry) {
      return NextResponse.json({ message: 'Invitation has expired' }, { status: 400 })
    }

    return NextResponse.json({
      data: {
        email: user.email,
        company: user.company?.nama || 'Unknown Company',
        role: user.role?.nama || 'Unknown Role'
      },
      message: 'Token is valid'
    })
  } catch (error) {
    console.error('Verify invitation error:', error)

    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
