import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import bcrypt from 'bcryptjs'

import prisma from '@/src/libs/prisma'
import { sendConfirmationEmail } from '@/src/libs/email'

// POST /api/invitation/accept - Accept invitation and complete registration
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, username, password } = body

    // Validation
    if (!token || !username || !password) {
      return NextResponse.json({ message: 'Token, username, and password are required' }, { status: 400 })
    }

    // Validate username (alphanumeric, underscore, 3-50 chars)
    const usernameRegex = /^[a-zA-Z0-9_]{3,50}$/

    if (!usernameRegex.test(username)) {
      return NextResponse.json(
        { message: 'Username must be 3-50 characters and contain only letters, numbers, and underscores' },
        { status: 400 }
      )
    }

    // Validate password (minimum 8 characters)
    if (password.length < 8) {
      return NextResponse.json({ message: 'Password must be at least 8 characters' }, { status: 400 })
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

    // Check if username already exists
    const existingUsername = await prisma.user.findFirst({
      where: {
        username,
        id: { not: user.id }
      }
    })

    if (existingUsername) {
      return NextResponse.json({ message: 'Username already taken' }, { status: 400 })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        username,
        password: hashedPassword,
        verifikasi: true,
        status: true,
        invitationToken: null,
        invitationExpiry: null
      }
    })

    // Send confirmation email
    try {
      await sendConfirmationEmail(user.email, username, user.company?.nama || 'Bantu Sewa')
    } catch (emailError) {
      console.error('Failed to send confirmation email:', emailError)

      // Don't fail the request if email fails, user is already activated
    }

    return NextResponse.json({
      message: 'Account activated successfully',
      data: {
        username: updatedUser.username,
        email: updatedUser.email
      }
    })
  } catch (error) {
    console.error('Accept invitation error:', error)

    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
