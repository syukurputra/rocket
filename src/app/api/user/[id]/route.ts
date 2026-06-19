import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import prisma from '@/src/libs/prisma'
import { withAuth, type AuthContext } from '@/src/libs/auth-middleware'

// GET /api/user/[id] - Get user by ID
async function handleGet(request: NextRequest, { user, params }: AuthContext & { params: { id: string } }) {
  try {
    const targetUser = await prisma.user.findUnique({
      where: { id: params.id },
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
      }
    })

    if (!targetUser) {
      return NextResponse.json({ message: 'User tidak ditemukan' }, { status: 404 })
    }

    const isSuperAdmin = user.role?.nama === 'Super Admin'

    if (!isSuperAdmin && targetUser.companyId !== user.companyId) {
      return NextResponse.json({ message: 'Akses tidak diizinkan' }, { status: 403 })
    }

    return NextResponse.json({
      data: targetUser,
      message: 'Data user berhasil diambil'
    })
  } catch (error) {
    console.error('Get user error:', error)

    return NextResponse.json({ message: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

// PUT /api/user/[id] - Update user
async function handlePut(request: NextRequest, { user, params }: AuthContext & { params: { id: string } }) {
  try {
    const body = await request.json()
    const { username, email, password, roleId, verifikasi, companyId, status } = body

    const targetUser = await prisma.user.findUnique({
      where: { id: params.id }
    })

    if (!targetUser) {
      return NextResponse.json({ message: 'User tidak ditemukan' }, { status: 404 })
    }

    const isSuperAdmin = user.role?.nama === 'Super Admin'

    if (!isSuperAdmin && targetUser.companyId !== user.companyId) {
      return NextResponse.json({ message: 'Akses tidak diizinkan' }, { status: 403 })
    }

    const updateData: any = {}

    if (username !== undefined) updateData.username = username
    if (email !== undefined) updateData.email = email
    if (roleId !== undefined) updateData.roleId = roleId
    if (verifikasi !== undefined) updateData.verifikasi = verifikasi
    if (status !== undefined) updateData.status = status
    if (isSuperAdmin && companyId !== undefined) updateData.companyId = companyId

    if (password) {
      const bcrypt = require('bcryptjs')

      updateData.password = await bcrypt.hash(password, 10)
    }

    const updatedUser = await prisma.user.update({
      where: { id: params.id },
      data: updateData,
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
      }
    })

    return NextResponse.json({
      data: updatedUser,
      message: 'User berhasil diperbarui'
    })
  } catch (error: any) {
    console.error('Update user error:', error)

    if (error.code === 'P2002') {
      return NextResponse.json({ message: 'Username atau email sudah terdaftar' }, { status: 400 })
    }

    return NextResponse.json({ message: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

// DELETE /api/user/[id] - Delete user
async function handleDelete(request: NextRequest, { user, params }: AuthContext & { params: { id: string } }) {
  try {
    const targetUser = await prisma.user.findUnique({
      where: { id: params.id }
    })

    if (!targetUser) {
      return NextResponse.json({ message: 'User tidak ditemukan' }, { status: 404 })
    }

    const isSuperAdmin = user.role?.nama === 'Super Admin'

    if (!isSuperAdmin && targetUser.companyId !== user.companyId) {
      return NextResponse.json({ message: 'Akses tidak diizinkan' }, { status: 403 })
    }

    if (params.id === user.id) {
      return NextResponse.json({ message: 'Tidak dapat menghapus akun sendiri' }, { status: 400 })
    }

    await prisma.user.delete({
      where: { id: params.id }
    })

    return NextResponse.json({
      message: 'User berhasil dihapus'
    })
  } catch (error) {
    console.error('Delete user error:', error)

    return NextResponse.json({ message: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

export const GET = withAuth(handleGet)
export const PUT = withAuth(handlePut)
export const DELETE = withAuth(handleDelete)
