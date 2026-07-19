import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import prisma from '@/src/libs/prisma'
import { withAuth, type AuthContext } from '@/src/libs/auth-middleware'
import { sendTagihanNotificationEmail } from '@/src/mails/tagihanNotificationEmail'

async function handleGet(request: NextRequest, { user }: AuthContext) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const penyewaId = searchParams.get('penyewaId') || ''

    const whereClause: any = {}

    if (search) {
      whereClause.OR = [{ keterangan: { contains: search.trim(), mode: 'insensitive' } }]
    }

    if (penyewaId) {
      whereClause.penyewaId = penyewaId

      // Hanya tagihan yang terhubung ke item aset milik company user login
      if (user.companyId) {
        whereClause.ruangan = { companyId: user.companyId }
      }
    } else {
      whereClause.createdById = user.id
    }

    const [data, total] = await Promise.all([
      prisma.tagihan.findMany({
        where: whereClause,
        include: {
          penyewa: {
            select: {
              id: true,
              nama: true,
              nomorTelepon: true,
              email: true
            }
          },
          aset: { select: { id: true, nama: true } },
          ruangan: { select: { id: true, nama: true } },
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
      prisma.tagihan.count({ where: whereClause })
    ])

    const totalPages = Math.ceil(total / limit)

    // Merge nomorTagihan via raw SQL (Prisma client cache belum include field ini)
    const ids = data.map((d: any) => d.id)
    const nomorRows = ids.length > 0
      ? await prisma.$queryRaw<{ id: string; nomorTagihan: string | null }[]>`
          SELECT id, "nomorTagihan" FROM "tagihan" WHERE id = ANY(${ids}::text[])
        `
      : []
    const nomorMap = new Map(nomorRows.map(r => [r.id, r.nomorTagihan]))
    const enriched = data.map((d: any) => ({ ...d, nomorTagihan: nomorMap.get(d.id) ?? null }))

    return NextResponse.json({
      data: enriched,
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
    console.error('Get tagihan error:', error)

    return NextResponse.json({ message: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

async function generateNomorTagihan(): Promise<string> {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const prefix = `TG-${year}${month}-`

  const rows = await prisma.$queryRawUnsafe<{ nomorTagihan: string }[]>(
    `SELECT "nomorTagihan" FROM "tagihan" WHERE "nomorTagihan" LIKE $1 ORDER BY "nomorTagihan" DESC LIMIT 1`,
    `${prefix}%`
  )

  const lastNum = rows.length > 0 ? parseInt(rows[0].nomorTagihan.slice(-5)) : 0

  return `${prefix}${String(lastNum + 1).padStart(5, '0')}`
}

async function handlePost(request: NextRequest, { user }: AuthContext) {
  try {
    const body = await request.json()
    const { keterangan, periodeSewa, mulaiSewa, selesaiSewa, penyewaId, nominal, asetId, ruanganId } = body

    if (!mulaiSewa || !selesaiSewa || !penyewaId) {
      return NextResponse.json({ message: 'mulai sewa dan selesai sewa harus diisi' }, { status: 400 })
    }

    let mulaiSewaDate = new Date()

    if (mulaiSewa) {
      mulaiSewaDate = new Date(mulaiSewa)

      if (isNaN(mulaiSewaDate.getTime())) {
        return NextResponse.json({ message: 'Format tanggal mulai sewa tidak valid' }, { status: 400 })
      }
    }

    let selesaiSewaDate = new Date()

    if (selesaiSewa) {
      selesaiSewaDate = new Date(selesaiSewa)

      if (isNaN(selesaiSewaDate.getTime())) {
        return NextResponse.json({ message: 'Format tanggal selesai sewa tidak valid' }, { status: 400 })
      }
    }

    // Validate that user has a companyId
    if (!user.companyId) {
      return NextResponse.json({ message: 'User tidak memiliki company yang valid' }, { status: 400 })
    }

    // Cek konflik tanggal pada ruangan yang sama dengan status LUNAS
    if (ruanganId) {
      const konflik = await prisma.tagihan.findFirst({
        where: {
          itemAsetId: ruanganId,
          status: 'LUNAS',
          AND: [
            { mulaiSewa: { lte: selesaiSewaDate } },
            { selesaiSewa: { gte: mulaiSewaDate } }
          ]
        }
      })
      if (konflik) {
        return NextResponse.json({ message: 'Tanggal yang dipilih tidak tersedia' }, { status: 409 })
      }
    }

    const nomorTagihan = await generateNomorTagihan()

    const newTagihan = await prisma.tagihan.create({
      data: {
        keterangan: keterangan || '',
        periodeSewa: periodeSewa || null,
        mulaiSewa: mulaiSewaDate,
        selesaiSewa: selesaiSewaDate,
        nominal: nominal || 0,
        penyewaId: penyewaId,
        asetId: asetId || null,
        itemAsetId: ruanganId || null,
        createdById: user.id,
        updatedById: user.id,
        companyId: user.companyId
      },
      include: {
        penyewa: {
          select: {
            id: true,
            nama: true,
            email: true
          }
        },
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

    // Simpan nomorTagihan via raw SQL (Prisma client cache belum include field ini)
    await prisma.$executeRaw`UPDATE "tagihan" SET "nomorTagihan" = ${nomorTagihan} WHERE id = ${newTagihan.id}`

    if (ruanganId) {
      await prisma.ruangan.update({ where: { id: ruanganId }, data: { status: 'Huni' } })
    }

    return NextResponse.json(
      {
        data: { ...newTagihan, nomorTagihan },
        message: 'Tagihan berhasil ditambahkan'
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Buat tagihan error:', error)

    return NextResponse.json({ message: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

export const GET = withAuth(handleGet)
export const POST = withAuth(handlePost)
