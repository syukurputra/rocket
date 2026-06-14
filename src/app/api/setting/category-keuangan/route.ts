import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import prisma from '@/src/libs/prisma'
import { withAuth, type AuthContext } from '@/src/libs/auth-middleware'

// GET /api/setting/category-keuangan - List categories
async function handleGet(request: NextRequest, { user }: AuthContext) {
  try {
    const categories = await prisma.categoryKeuangan.findMany({
      where: {
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
      },
      orderBy: [{ nama: 'asc' }]
    })

    return NextResponse.json({
      data: categories,
      message: 'Data kategori berhasil diambil'
    })
  } catch (error) {
    console.error('Get categories error:', error)

    // Check if it's a Prisma error about missing table
    if (error instanceof Error && error.message.includes('category_keuangan')) {
      return NextResponse.json(
        {
          message:
            'Table category_keuangan belum ada. Silakan jalankan migration terlebih dahulu: npx prisma migrate dev --name add_category_keuangan',
          error: error.message
        },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        message: 'Terjadi kesalahan server',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// POST /api/setting/category-keuangan - Create new category
async function handlePost(request: NextRequest, { user }: AuthContext) {
  try {
    const body = await request.json()
    const { nama, jenis, deskripsi, iconId, color, status = true } = body

    if (!nama) {
      return NextResponse.json({ message: 'Nama kategori harus diisi' }, { status: 400 })
    }

    if (!jenis) {
      return NextResponse.json({ message: 'Jenis kategori harus diisi' }, { status: 400 })
    }

    if (!['Pengeluaran', 'Pemasukan', 'pengeluaran', 'pemasukan'].includes(jenis)) {
      return NextResponse.json({ message: 'Jenis harus "Pengeluaran" atau "Pemasukan"' }, { status: 400 })
    }

    if (!user.companyId) {
      return NextResponse.json({ message: 'User tidak terkait dengan perusahaan' }, { status: 400 })
    }

    const category = await prisma.categoryKeuangan.create({
      data: {
        nama,
        jenis: jenis.toLowerCase(),
        deskripsi: deskripsi || null,
        iconId: iconId || null,
        color: color || null,
        status,
        companyId: user.companyId!,
        createdById: user.id,
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

    return NextResponse.json(
      {
        data: category,
        message: 'Kategori berhasil dibuat'
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Create category error:', error)

    return NextResponse.json({ message: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

export const GET = withAuth(handleGet)
export const POST = withAuth(handlePost)
