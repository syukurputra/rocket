import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import prisma from '@/src/libs/prisma'
import { withAuth, type AuthContext } from '@/src/libs/auth-middleware'

// GET /api/user - List users in company
async function handleGet(request: NextRequest, { user }: AuthContext) {
  try {
    // Check if user is super admin by role name
    const isSuperAdmin = user.role?.nama === 'Super Admin'

    const where = isSuperAdmin ? {} : { companyId: user.companyId! }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        username: true,
        email: true,
        verifikasi: true,
        companyId: true,
        roleId: true,
        createdAt: true,
        updatedAt: true,
        company: {
          select: {
            id: true,
            nama: true
          }
        },
        role: {
          select: {
            id: true,
            nama: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({
      data: users,
      message: 'Data user berhasil diambil'
    })
  } catch (error) {
    console.error('Get users error:', error)

    return NextResponse.json({ message: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

// POST /api/user - Create new user
async function handlePost(request: NextRequest, { user }: AuthContext) {
  try {
    const body = await request.json()
    const { username, email, password, roleId, verifikasi = false, status = true } = body

    if (!username || !email || !password) {
      return NextResponse.json({ message: 'Username, email, dan password wajib diisi' }, { status: 400 })
    }

    // Hash password
    const bcrypt = require('bcryptjs')
    const hashedPassword = await bcrypt.hash(password, 10)

    const newUser = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
        verifikasi,
        status,
        companyId: user.companyId!,
        roleId
      },
      select: {
        id: true,
        username: true,
        email: true,
        verifikasi: true,
        companyId: true,
        roleId: true,
        createdAt: true,
        updatedAt: true
      }
    })

    return NextResponse.json(
      {
        data: newUser,
        message: 'Penyewa berhasil dibuat'
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Create user error:', error)

    if (error.code === 'P2002') {
      return NextResponse.json({ message: 'Username atau email sudah terdaftar' }, { status: 400 })
    }

    return NextResponse.json({ message: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

export const GET = withAuth(handleGet)
export const POST = withAuth(handlePost)
