import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import prisma from '@/src/libs/prisma'
import { withAuth, type AuthContext } from '@/src/libs/auth-middleware'

async function handleGet(_request: NextRequest, _ctx: AuthContext) {
  try {
    const data = await prisma.masterJenisAset.findMany({
      orderBy: { nama: 'asc' }
    })

    return NextResponse.json({ data, message: 'Data jenis aset berhasil diambil' })
  } catch (error) {
    console.error('Get jenis aset error:', error)

    return NextResponse.json({ message: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

async function handlePost(request: NextRequest, _ctx: AuthContext) {
  try {
    const body = await request.json()
    const { nama, status = true } = body

    if (!nama) {
      return NextResponse.json({ message: 'Nama jenis aset harus diisi' }, { status: 400 })
    }

    const data = await prisma.masterJenisAset.create({ data: { nama, status } })

    return NextResponse.json({ data, message: 'Jenis aset berhasil dibuat' }, { status: 201 })
  } catch (error) {
    console.error('Create jenis aset error:', error)

    return NextResponse.json({ message: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

export const GET = withAuth(handleGet)
export const POST = withAuth(handlePost)
