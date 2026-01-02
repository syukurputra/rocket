import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import bcrypt from 'bcryptjs'

import prisma from '@/src/libs/prisma'
import { verifyEmailConnection } from '@/src/mails/verifyEmailConnection'

export async function POST(request: NextRequest) {
  try {
    const { username, email, password } = await request.json()

    const user = await prisma.user.findFirst({
      where: {
        OR: [{ username: username }, { email: email }]
      }
    })

    if (user) {
      return NextResponse.json({ message: 'Username / email sudah terdaftar' }, { status: 400 })
    }

    const passwordEnc = await bcrypt.hash(password, 10)

    // Create company for new user
    const company = await prisma.company.create({
      data: {
        nama: `${username}'s Company`,
        status: true
      }
    })

    // Create default admin role for the company
    const adminRole = await prisma.role.create({
      data: {
        nama: 'Administrator',
        deskripsi: 'Full access to all features',
        status: true,
        companyId: company.id
      }
    })

    // Create user and assign to company and admin role
    const userInsert = await prisma.user.create({
      data: {
        username: username,
        email: email,
        password: passwordEnc,
        companyId: company.id,
        roleId: adminRole.id
      }
    })

    await verifyEmailConnection(userInsert.id, userInsert.email, userInsert.username)

    const res = NextResponse.json(
      {
        message: 'Registration successful',
        user: { id: userInsert.id, username: userInsert.username, email: userInsert.email }
      },
      { status: 200 }
    )

    return res
  } catch (error) {
    console.error('Register error:', error)

    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
