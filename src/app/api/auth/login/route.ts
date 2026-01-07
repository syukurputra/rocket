import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import bcrypt from 'bcryptjs'

import prisma from '@/src/libs/prisma'
import { signAccessToken, signRefreshToken } from '@/src/libs/jwt'
import { setSessionCookies } from '@/src/libs/session'

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()

    const user = await prisma.user.findFirst({
      where: {
        OR: [{ username: username }, { email: username }]
      },
      include: {
        role: {
          include: {
            roleMenus: {
              where: {
                menu: {
                  status: true
                }
              },
              include: {
                menu: true
              },
              orderBy: {
                menu: {
                  urutan: 'asc'
                }
              }
            }
          }
        },
        company: {
          select: {
            id: true,
            nama: true
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json({ message: 'Username / password salah' }, { status: 401 })
    }

    // Check if user has a password (users who signed up with Google won't have one)
    if (!user.password) {
      return NextResponse.json(
        { message: 'Akun ini menggunakan Google Login. Silakan login dengan Google.' },
        { status: 401 }
      )
    }

    const isValidPassword = await bcrypt.compare(password, user.password)

    if (!isValidPassword) {
      return NextResponse.json({ message: 'Username / password salah' }, { status: 401 })
    }

    if (!user.verifikasi) {
      return NextResponse.json({ message: 'Mohon lakukan verifikasi email terlebih dahulu' }, { status: 401 })
    }

    const accessToken = signAccessToken({
      userId: user.id,
      username: user.username,
      email: user.email
    })

    const refreshToken = signRefreshToken({
      userId: user.id,
      tokenVersion: user.tokenVersion || 0
    })

    // Format menus with permissions
    const menus =
      user.role?.roleMenus.map(rm => ({
        id: rm.menu.id,
        nama: rm.menu.nama,
        path: rm.menu.path,
        icon: rm.menu.icon,
        urutan: rm.menu.urutan,
        parentId: rm.menu.parentId,
        permissions: {
          canCreate: rm.canCreate,
          canRead: rm.canRead,
          canUpdate: rm.canUpdate,
          canDelete: rm.canDelete
        }
      })) || []

    const res = NextResponse.json(
      {
        message: 'Login berhasil',
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          company: user.company,
          role: user.role
            ? {
                id: user.role.id,
                nama: user.role.nama,
                deskripsi: user.role.deskripsi
              }
            : null
        },
        menus,
        accessToken,
        refreshToken
      },
      { status: 200 }
    )

    setSessionCookies(res, { accessToken, refreshToken })

    return res
  } catch (error) {
    console.error('Login error:', error)

    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
