import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import prisma from '@/src/libs/prisma'
import { withAuth, type AuthContext } from '@/src/libs/auth-middleware'

// GET /api/management-master/role - List all roles across all companies (super admin only)
async function handleGet(_request: NextRequest, { user }: AuthContext) {
  try {
    const isSuperAdmin =
      user.roleId === 'superadmin' ||
      user.role?.nama?.toLowerCase().replace(/\s+/g, '') === 'superadmin'

    if (!isSuperAdmin) {
      return NextResponse.json({ message: 'Akses ditolak' }, { status: 403 })
    }

    const roles = await prisma.role.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        company: {
          select: { id: true, nama: true }
        },
        _count: {
          select: { users: true }
        }
      }
    })

    return NextResponse.json({
      data: roles,
      message: 'Data role berhasil diambil'
    })
  } catch (error) {
    console.error('Get all roles error:', error)

    return NextResponse.json({ message: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

export const GET = withAuth(handleGet)
