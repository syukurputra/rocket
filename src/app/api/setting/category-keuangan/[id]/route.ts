import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import prisma from '@/src/libs/prisma'
import { withAuth, type AuthContext } from '@/src/libs/auth-middleware'

// GET /api/setting/category-keuangan/[id] - Get category by ID
async function handleGet(request: NextRequest, { user, params }: AuthContext & { params: { id: string } }) {
  try {
    const category = await prisma.categoryKeuangan.findFirst({
      where: {
        id: params.id,
        companyId: user.companyId!
      },
      include: {
        icon: {
          select: {
            id: true,
            nama: true,
            code: true
          }
        },
        createdBy: {
          select: {
            id: true,
            username: true,
            email: true
          }
        },
        updatedBy: {
          select: {
            id: true,
            username: true,
            email: true
          }
        }
      }
    })

    if (!category) {
      return NextResponse.json({ message: 'Category not found' }, { status: 404 })
    }

    return NextResponse.json({
      data: category,
      message: 'Category retrieved successfully'
    })
  } catch (error) {
    console.error('Get category error:', error)

    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/setting/category-keuangan/[id] - Update category
async function handlePut(request: NextRequest, { user, params }: AuthContext & { params: { id: string } }) {
  try {
    const body = await request.json()
    const { nama, deskripsi, iconId, color, status } = body

    if (!nama) {
      return NextResponse.json({ message: 'Nama kategori harus diisi' }, { status: 400 })
    }

    // Verify category belongs to user's company
    const existingCategory = await prisma.categoryKeuangan.findFirst({
      where: {
        id: params.id,
        companyId: user.companyId!
      }
    })

    if (!existingCategory) {
      return NextResponse.json({ message: 'Category not found' }, { status: 404 })
    }

    const category = await prisma.categoryKeuangan.update({
      where: { id: params.id },
      data: {
        nama,
        deskripsi: deskripsi || null,
        iconId: iconId || null,
        color: color || null,
        status: status !== undefined ? Boolean(status) : undefined,
        updatedById: user.id
      },
      include: {
        icon: {
          select: {
            id: true,
            nama: true,
            code: true
          }
        },
        createdBy: {
          select: {
            id: true,
            username: true,
            email: true
          }
        },
        updatedBy: {
          select: {
            id: true,
            username: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json({
      data: category,
      message: 'Category updated successfully'
    })
  } catch (error) {
    console.error('Update category error:', error)

    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/setting/category-keuangan/[id] - Delete category
async function handleDelete(request: NextRequest, { user, params }: AuthContext & { params: { id: string } }) {
  try {
    // Verify category belongs to user's company
    const existingCategory = await prisma.categoryKeuangan.findFirst({
      where: {
        id: params.id,
        companyId: user.companyId!
      }
    })

    if (!existingCategory) {
      return NextResponse.json({ message: 'Category not found' }, { status: 404 })
    }

    await prisma.categoryKeuangan.delete({
      where: { id: params.id }
    })

    return NextResponse.json({
      message: 'Category deleted successfully'
    })
  } catch (error) {
    console.error('Delete category error:', error)

    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

export const GET = withAuth(handleGet)
export const PUT = withAuth(handlePut)
export const DELETE = withAuth(handleDelete)
