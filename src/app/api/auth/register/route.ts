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

    // Generate random company name
    const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase()
    const companyName = `Company-${randomSuffix}`

    // Create company for new user
    // Create company for new user
    // Fixed paket ID as requested
    const defaultPaketId = 'cmkf1ia1e00005kf4wckr0x8x'

    const company = await prisma.company.create({
      data: {
        nama: companyName,
        status: true,
        paketId: defaultPaketId,
        paketStartDate: new Date(),
        paketEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // +30 days (1 month)
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
        email: email,
        password: passwordEnc,
        companyId: company.id,
        roleId: adminRole.id
      }
    })

    // Assign menus based on paket
    try {
      const paketMenus = await prisma.paketMenu.findMany({
        where: { paketId: defaultPaketId }
      })

      if (paketMenus.length > 0) {
        await prisma.menuRole.createMany({
          data: paketMenus.map(pm => ({
            roleId: adminRole.id,
            menuId: pm.menuId
          }))
        })
      }
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
        message: 'Registration successful',
        user: { id: userInsert.id, username: userInsert.username, email: userInsert.email }
      },
      { status: 200 }
    )

    return res
  } catch (error) {
    console.error('Registration error:', error)

    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
