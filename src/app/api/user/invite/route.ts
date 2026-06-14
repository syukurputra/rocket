import crypto from 'crypto'

import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import prisma from '@/src/libs/prisma'
import { withAuth, type AuthContext } from '@/src/libs/auth-middleware'
import { sendInvitationEmail } from '@/src/libs/email'

// POST /api/user/invite - Invite new user via email
async function handlePost(request: NextRequest, { user }: AuthContext) {
  try {
    const body = await request.json()
    const { email, roleId } = body

    if (!email || !roleId) {
      return NextResponse.json({ message: 'Email dan role wajib diisi' }, { status: 400 })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    if (!emailRegex.test(email)) {
      return NextResponse.json({ message: 'Format email tidak valid' }, { status: 400 })
    }

    if (!user.companyId) {
      return NextResponse.json({ message: 'User tidak terhubung dengan perusahaan' }, { status: 400 })
    }

    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json({ message: 'Email sudah terdaftar' }, { status: 400 })
    }

    const [role, company] = await Promise.all([
      prisma.role.findUnique({
        where: { id: roleId },
        select: { id: true, nama: true, companyId: true }
      }),
      prisma.company.findUnique({
        where: { id: user.companyId },
        select: { id: true, nama: true }
      })
    ])

    if (!role) {
      return NextResponse.json({ message: 'Role tidak ditemukan' }, { status: 404 })
    }

    if (!company) {
      return NextResponse.json({ message: 'Perusahaan tidak ditemukan' }, { status: 404 })
    }

    if (role.companyId !== user.companyId) {
      return NextResponse.json({ message: 'Role tidak terkait dengan perusahaan Anda' }, { status: 403 })
    }

    const invitationToken = crypto.randomBytes(32).toString('hex')
    const invitationExpiry = new Date()

    invitationExpiry.setDate(invitationExpiry.getDate() + 7)

    const newUser = await prisma.user.create({
      data: {
        email,
        username: `pending_${Date.now()}`,
        password: crypto.randomBytes(32).toString('hex'),
        role: {
          connect: { id: roleId }
        },
        company: {
          connect: { id: user.companyId }
        },
        verifikasi: false,
        status: false,
        invitationToken,
        invitationExpiry,
        invitedAt: new Date(),
        invitedBy: {
          connect: { id: user.id }
        }
      }
    })

    try {
      await sendInvitationEmail(email, company.nama, role.nama, invitationToken)
    } catch (emailError) {
      console.error('Failed to send invitation email:', emailError)

      await prisma.user.delete({ where: { id: newUser.id } })

      return NextResponse.json(
        { message: 'Gagal mengirim email undangan. Periksa konfigurasi email.' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        message: 'Undangan berhasil dikirim',
        data: {
          id: newUser.id,
          email: newUser.email
        }
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Invite user error:', error)

    return NextResponse.json({ message: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

export const POST = withAuth(handlePost)
