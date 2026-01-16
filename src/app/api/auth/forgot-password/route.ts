import crypto from 'crypto'

import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import prisma from '@/src/libs/prisma'
import { sendEmail } from '@/src/libs/mailer'

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

    // Kirim email
    const resetUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/reset-password?token=${resetToken}`

    const emailResult = await sendEmail({
      to: email,
      subject: 'Reset Password - Bantu Sewa',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Reset Password</h2>
          <p>Anda menerima email ini karena ada permintaan untuk mereset password akun Anda.</p>
          <p>Klik tombol di bawah ini untuk mereset password:</p>
          <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0;">Reset Password</a>
          <p>Atau copy link berikut ke browser Anda:</p>
          <p style="word-break: break-all; color: #666;">${resetUrl}</p>
          <p style="color: #999; font-size: 12px; margin-top: 30px;">Link ini akan kadaluarsa dalam 1 jam.</p>
          <p style="color: #999; font-size: 12px;">Jika Anda tidak meminta reset password, abaikan email ini.</p>
        </div>
      `,
      text: `Reset password Anda dengan mengklik link berikut: ${resetUrl}\n\nLink ini akan kadaluarsa dalam 1 jam.`
    })

    if (!emailResult.success) {
      console.error('Failed to send email:', emailResult.error)

      return NextResponse.json({ message: 'Gagal mengirim email reset password' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Jika email terdaftar, link reset password akan dikirim' }, { status: 200 })
  } catch (error) {
    console.error('Forgot password error:', error)

    return NextResponse.json({ message: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
