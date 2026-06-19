import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/src/libs/prisma'
import { verifyAccessToken } from '@/src/libs/jwt'
import { extractTokenFromRequest, getAccessTokenFromCookies } from '@/src/libs/session'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  try {
    const token =
      extractTokenFromRequest(req) ||
      getAccessTokenFromCookies(req)

    if (!token) {
      return NextResponse.json({ message: 'Token akses diperlukan' }, { status: 401 })
    }

    let payload: { userId: string }
    try {
      payload = verifyAccessToken(token) as { userId: string }
    } catch {
      return NextResponse.json({ message: 'Token tidak valid atau sudah kadaluarsa' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        username: true,
        email: true,
        nomorTelepon: true,
        photoUrl: true,
        createdAt: true,
        updatedAt: true,
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
        },
        company: {
          select: {
            id: true,
            nama: true,
            paketId: true,
            isTrial: true
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json({ message: 'User tidak ditemukan' }, { status: 404 })
    }

    const menus =
      user.role?.menuRoles.map(mr => ({
        id: mr.menu.id,
        nama: mr.menu.nama,
        path: mr.menu.path,
        icon: mr.menu.icon,
        urutan: mr.menu.urutan,
        parentId: mr.menu.parentId
      })) || []

    const userData = {
      id: user.id,
      username: user.username,
      email: user.email,
      nomorTelepon: user.nomorTelepon,
      photoUrl: user.photoUrl,
      company: user.company,
      role: user.role
        ? {
            id: user.role.id,
            nama: user.role.nama,
            deskripsi: user.role.deskripsi
          }
        : null
    }

    return NextResponse.json({ user: userData, menus }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (err) {
    console.error('Get user error:', err)
    return NextResponse.json({ message: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
