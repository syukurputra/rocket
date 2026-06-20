import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import prisma from '@/src/libs/prisma'
import { withAuth, type AuthContext } from '@/src/libs/auth-middleware'

async function handleGet(request: NextRequest, { user }: AuthContext) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''

    const whereClause: any = {}

    if (search) {
      whereClause.OR = [{ nama: { contains: search.trim(), mode: 'insensitive' } }]
    }

    whereClause.createdById = user.id

    const [data, total] = await Promise.all([
      prisma.penyewa.findMany({
        where: whereClause,
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
          },
          aset: {
            select: {
              id: true,
              nama: true,
              jenis: true
            }
          },
          ruangan: {
            select: {
              id: true,
              nama: true
            }
          }
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.penyewa.count({ where: whereClause })
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
      message: 'Data berhasil diambil'
    })
  } catch (error) {
    console.error('Get penyewaerror:', error)

    return NextResponse.json({ message: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

async function handlePost(request: NextRequest, { user }: AuthContext) {
  try {
    const body = await request.json()
    const { nama, email, nomorTelepon, nomorKtp, status, asetId, ruanganId, alamat, provinsi, kota, kecamatan, kelurahan, latitude, longitude } = body

    if (!nama || !status || !asetId || !ruanganId) {
      return NextResponse.json({ message: 'nama, status, aset dan ruangan harus diisi' }, { status: 400 })
    }

    // Validate that user has a companyId
    if (!user.companyId) {
      return NextResponse.json({ message: 'User tidak memiliki company yang valid' }, { status: 400 })
    }

    const newPenyewa = await prisma.penyewa.create({
      data: {
        nama: nama,
        email: email || null,
        nomorTelepon: nomorTelepon || null,
        nomorKtp: nomorKtp || null,
        alamat: alamat || null,
        provinsi: provinsi || null,
        kota: kota || null,
        kecamatan: kecamatan || null,
        kelurahan: kelurahan || null,
        latitude: latitude || null,
        longitude: longitude || null,
        status: status,
        asetId: asetId,
        ruanganId: ruanganId,
        createdById: user.id,
        updatedById: user.id,
        companyId: user.companyId
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

    // Auto-update ruangan status to 'Huni'
    await prisma.ruangan.update({
      where: { id: ruanganId },
      data: { status: 'Huni' }
    })

    return NextResponse.json(
      {
        data: newPenyewa,
        message: 'Penyewa berhasil ditambahkan'
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Buat penyewa error:', error)

    return NextResponse.json({ message: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

export const GET = withAuth(handleGet)
export const POST = withAuth(handlePost)
