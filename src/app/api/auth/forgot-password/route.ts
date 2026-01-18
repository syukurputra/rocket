import crypto from 'crypto'

import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import prisma from '@/src/libs/prisma'
import { sendResetPasswordEmail } from '@/src/mails/resetPasswordEmail'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email } = body

    if (!email) {
      return NextResponse.json({ message: 'Email harus diisi' }, { status: 400 })
    }

    // Cari user berdasarkan email
    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      // Jangan kasih tau kalau email tidak ditemukan (security best practice)
      return NextResponse.json({ message: 'Jika email terdaftar, link reset password akan dikirim' }, { status: 200 })
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex')
    const resetTokenExpiry = new Date(Date.now() + 3600000) // 1 jam dari sekarang

    // Simpan token ke database
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpiry
      }
    })

    // Kirim email menggunakan template baru
    try {
      await sendResetPasswordEmail(email, user.username, resetToken)
    } catch (emailError) {
      console.error('Failed to send reset password email:', emailError)

      return NextResponse.json({ message: 'Gagal mengirim email reset password' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Jika email terdaftar, link reset password akan dikirim' }, { status: 200 })
  } catch (error) {
    console.error('Forgot password error:', error)

    return NextResponse.json({ message: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
