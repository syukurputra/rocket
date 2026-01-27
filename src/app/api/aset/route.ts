import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import prisma from '@/src/libs/prisma'
import { withAuth, type AuthContext } from '@/src/libs/auth-middleware'

async function handleGet(req: NextRequest, { user }: AuthContext) {
  const { searchParams } = new URL(req.url)
  const page = parseInt(searchParams.get('page') || '1', 10)
  const limit = parseInt(searchParams.get('limit') || '10', 10)
  const search = searchParams.get('search') || ''
  const status = searchParams.get('status')

  const where: any = {
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
        images: true,
        createdBy: { select: { id: true, username: true } },
        updatedBy: { select: { id: true, username: true } }
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' }
    }),
    prisma.aset.count({ where })
  ])

  const totalPages = Math.ceil(total / limit)

  return NextResponse.json({
    data,
    pagination: {
      page,
      limit,
      totalCount: total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1
    },
    message: 'Data retrieved successfully'
  })
}

async function handlePost(req: NextRequest, { user }: AuthContext) {
  const body = await req.json()
  const { jenis, nama, alamat, kota, provinsi, latitude, longitude, status } = body

  if (!jenis || !nama || !alamat || !kota || !provinsi) {
    return NextResponse.json({ message: 'Jenis, nama, alamat, kota dan provinsi harus diisi' }, { status: 400 })
  }

  // Validate that user has a companyId
  if (!user.companyId) {
    return NextResponse.json({ message: 'User tidak memiliki company yang valid' }, { status: 400 })
  }

  const newAset = await prisma.aset.create({
    data: {
      jenis,
      nama,
      alamat,
      kota,
      provinsi,
      latitude: latitude !== undefined ? Number(latitude) : null,
      longitude: longitude !== undefined ? Number(longitude) : null,
      status: status || 'aktif',
      createdById: user.id,
      updatedById: user.id,
      companyId: user.companyId
    },
    include: {
      images: true,
      createdBy: { select: { id: true, username: true } },
      updatedBy: { select: { id: true, username: true } }
    }
  })

  return NextResponse.json({ data: newAset, message: 'Aset berhasil ditambahkan' }, { status: 201 })
}

export const GET = withAuth(handleGet)
export const POST = withAuth(handlePost)
