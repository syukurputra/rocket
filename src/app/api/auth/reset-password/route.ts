import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import prisma from '@/src/libs/prisma'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { token, password } = body

    if (!token || !password) {
      return NextResponse.json({ message: 'Token dan password harus diisi' }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ message: 'Password minimal 6 karakter' }, { status: 400 })
    }

    // Cari user dengan token yang valid
    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: {
          gte: new Date() // Token belum kadaluarsa
        }
      }
    })

    if (!user) {
      return NextResponse.json({ message: 'Token tidak valid atau sudah kadaluarsa' }, { status: 400 })
    }

    // Hash password baru
    const hashedPassword = await bcrypt.hash(password, 10)

    // Update password dan hapus reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
        tokenVersion: { increment: 1 } // Invalidate semua token JWT yang ada
      }
    })

    return NextResponse.json(
      { message: 'Password berhasil direset. Silakan login dengan password baru Anda.' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Reset password error:', error)
    return NextResponse.json({ message: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
