import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import prisma from '@/src/libs/prisma'
import { withAuth, type AuthContext } from '@/src/libs/auth-middleware'

async function handleGet(req: NextRequest, { user }: AuthContext) {
  const { searchParams } = new URL(req.url)
  const ruanganId = searchParams.get('ruanganId')
  const asetId = searchParams.get('asetId')

  const where: any = {}

  if (ruanganId) {
    where.ruanganId = ruanganId
  }

  if (asetId) {
    where.ruangan = {
      asetId: asetId
    }
  }

  const data = await prisma.fasilitasRuangan.findMany({
    where,
    include: {
      icon: true,
      ruangan: {
        select: {
          id: true,
          nama: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  return NextResponse.json({
    data,
    message: 'Data berhasil diambil'
  })
}

async function handlePost(req: NextRequest, { user }: AuthContext) {
  const body = await req.json()
  const { nama, iconId, ruanganId } = body

  if (!nama || !iconId || !ruanganId) {
    return NextResponse.json({ message: 'Nama, iconId, dan ruanganId harus diisi' }, { status: 400 })
  }

  const newFasilitas = await prisma.fasilitasRuangan.create({
    data: {
      nama,
      iconId,
      ruanganId
    },
    include: {
      icon: true,
      ruangan: {
        select: {
          id: true,
          nama: true
        }
      }
    }
  })

  return NextResponse.json({ data: newFasilitas, message: 'Fasilitas item aset berhasil ditambahkan' }, { status: 201 })
}

export const GET = withAuth(handleGet)
export const POST = withAuth(handlePost)
