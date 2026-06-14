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

    if (!token || !username || !password) {
      return NextResponse.json({ message: 'Token, username, dan password wajib diisi' }, { status: 400 })
    }

    const usernameRegex = /^[a-zA-Z0-9_]{3,50}$/

    if (!usernameRegex.test(username)) {
      return NextResponse.json(
        { message: 'Username harus 3-50 karakter dan hanya boleh mengandung huruf, angka, dan garis bawah' },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json({ message: 'Password minimal 8 karakter' }, { status: 400 })
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

    const existingUsername = await prisma.user.findFirst({
      where: {
        username,
        id: { not: user.id }
      }
    })

    if (existingUsername) {
      return NextResponse.json({ message: 'Username sudah digunakan' }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

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

    try {
      await sendConfirmationEmail(user.email, username, user.company?.nama || 'Bantu Sewa')
    } catch (emailError) {
      console.error('Failed to send confirmation email:', emailError)
    }

    return NextResponse.json({
      message: 'Akun berhasil diaktifkan',
      data: {
        username: updatedUser.username,
        email: updatedUser.email
      }
    })
  } catch (error) {
    console.error('Accept invitation error:', error)

    return NextResponse.json({ message: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
