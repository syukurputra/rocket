import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/src/libs/prisma'
import { withAuth, type AuthContext } from '@/src/libs/auth-middleware'

async function handleGet(request: NextRequest, { user, payload }: AuthContext, params?: any) {
  try {

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status')

    const where = {
      createdById: user.id,
      ...(search && {
        OR: [
          { nama: { contains: search, mode: 'insensitive' as const } },
          { alamat: { contains: search, mode: 'insensitive' as const } }
        ]
      }),
      ...(status !== null && status !== '' && { status: status === 'true' })
    }

    const [data, total] = await Promise.all([
      prisma.aset.findMany({
        where,
        include: {
          createdBy: {
            select: {
              id: true,
              username: true
            }
          },
          updatedBy: {
            select: {
              id: true,
              username: true
            }
          }
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.aset.count({ where })
    ])

    return NextResponse.json({
      data,
      total: total,
      page: page,
      limit: limit,
      message: 'Data retrieved successfully'
    })

  } catch (error) {
    console.error('Get aset error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function handlePost(request: NextRequest, { user, payload }: AuthContext) {
  try {

    const currentUser = await prisma.user.findUnique({
      where: { id: user.id }
    })

    if (!currentUser) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const { jenis, nama, alamat, kota, provinsi, status } = body

    if (!jenis || !nama || !alamat || !kota || !provinsi) {
      return NextResponse.json(
        { message: 'Jenis, nama, alamat, kota dan provinsi harus diisi' },
        { status: 400 }
      )
    }

    const newAset = await prisma.aset.create({
      data: {
        jenis,
        nama,
        alamat,
        kota,
        provinsi,
        status: status !== undefined ? Boolean(status) : true,
        createdById: currentUser.id,
        updatedById: currentUser.id
      },
      include: {
        createdBy: {
          select: {
            id: true,
            username: true
          }
        },
        updatedBy: {
          select: {
            id: true,
            username: true
          }
        }
      }
    })

    return NextResponse.json({
      data: newAset,
      message: 'Aset berhasil ditambahkan'
    }, { status: 201 })

  } catch (error) {
    console.error('Create aset error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export const GET = withAuth(handleGet)
export const POST = withAuth(handlePost)
