import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import bcrypt from 'bcryptjs'

import prisma from '@/src/libs/prisma'
import { beriSemuaMenuTenant } from '@/src/libs/menuTenant'
import { verifyEmailConnection } from '@/src/mails/verifyEmailConnection'

export async function POST(request: NextRequest) {
  try {
    const { username, name, email, password, nomorTelepon } = await request.json()

    // Validate phone number format (Indonesian)
    if (!nomorTelepon) {
      return NextResponse.json({ message: 'Nomor telepon wajib diisi' }, { status: 400 })
    }

    // Check Indonesian phone format: must start with +62 or 08
    const phoneRegex = /^(\+62|62|08)[0-9]{8,12}$/

    if (!phoneRegex.test(nomorTelepon)) {
      return NextResponse.json(
        { message: 'Format nomor telepon tidak valid. Gunakan format +62 atau 08' },
        { status: 400 }
      )
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [{ username: username }, { email: email }]
      }
    })

    if (user) {
      return NextResponse.json({ message: 'Username / email sudah terdaftar' }, { status: 400 })
    }

    const passwordEnc = await bcrypt.hash(password, 10)

    // Generate random company name
    const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase()
    const companyName = `Company-${randomSuffix}`

    // Create company for new user. Bantu Sewa 100% gratis — tanpa paket.
    const company = await prisma.company.create({
      data: {
        nama: companyName,
        status: true
      }
    })

    // Create default admin role for the company
    const adminRole = await prisma.role.create({
      data: {
        nama: 'Super Admin',
        deskripsi: 'Administrator with full access',
        status: true,
        companyId: company.id
      }
    })

    // Create user and assign to company and admin role
    const userInsert = await prisma.user.create({
      data: {
        username: username,
        name: name || username,
        email: email,
        nomorTelepon: nomorTelepon,
        password: passwordEnc,
        companyId: company.id,
        roleId: adminRole.id
      }
    })

    // Semua usaha mendapat semua fitur
    try {
      await beriSemuaMenuTenant(adminRole.id)
    } catch (menuError) {
      console.error('Error assigning menus:', menuError)

      // Continue execution, non-fatal
    }

    // Send verification email (non-blocking)
    try {
      await verifyEmailConnection(userInsert.id, userInsert.email, userInsert.username)
    } catch (emailError) {
      console.error('Error sending verification email:', emailError)

      // Continue execution, email sending failure should not block registration
    }

    const res = NextResponse.json(
      {
        message: 'Registrasi berhasil',
        user: { id: userInsert.id, username: userInsert.username, email: userInsert.email }
      },
      { status: 200 }
    )

    return res
  } catch (error) {
    console.error('Registration error:', error)

    return NextResponse.json({ message: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
