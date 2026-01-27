import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server'

import { verifyRefreshToken, signAccessToken, signRefreshToken } from '@/src/libs/jwt'
import prisma from '@/src/libs/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { refreshToken } = body

    if (!refreshToken) {
      return NextResponse.json({ error: 'Refresh token required' }, { status: 400 })
    }

    // Verify refresh token
    const payload = verifyRefreshToken(refreshToken)

    // Check if user exists and token version matches
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        username: true,
        email: true,
        tokenVersion: true,
        role: {
          include: {
            menuRoles: {
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
        }
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 })
    }

    // Check token version (to handle revoked tokens)
    if (user.tokenVersion !== payload.tokenVersion) {
      return NextResponse.json({ error: 'Token revoked' }, { status: 401 })
    }

    // Generate new access token
    const newAccessToken = signAccessToken({
      userId: user.id,
      username: user.username,
      email: user.email
    })

    // Optionally generate new refresh token (rotate refresh tokens)
    const newRefreshToken = signRefreshToken({
      userId: user.id,
      tokenVersion: user.tokenVersion
    })

    // Format menus from menuRoles
    const menus =
      user.role?.menuRoles.map(mr => ({
        id: mr.menu.id,
        nama: mr.menu.nama,
        path: mr.menu.path,
        icon: mr.menu.icon,
        urutan: mr.menu.urutan,
        parentId: mr.menu.parentId
      })) || []

    return NextResponse.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      },
      menus
    })
  } catch (error) {
    console.error('Refresh token error:', error)
    
return NextResponse.json({ error: 'Invalid refresh token' }, { status: 401 })
  }
}
