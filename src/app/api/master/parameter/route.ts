import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import prisma from '@/src/libs/prisma'
import { withAuth, type AuthContext } from '@/src/libs/auth-middleware'
import { clearParameterCache } from '@/src/libs/getParameter'

async function handleGet(_request: NextRequest, _ctx: AuthContext) {
  try {
    const data = await (prisma as any).masterParameter.findMany({
      orderBy: { nama: 'asc' }
    })

    return NextResponse.json({ data, message: 'Data parameter berhasil diambil' })
  } catch (error) {
    console.error('Get parameter error:', error)

    return NextResponse.json({ message: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

async function handlePost(request: NextRequest, _ctx: AuthContext) {
  try {
    const body = await request.json()
    const { id, nama, value } = body

    if (!id?.trim()) {
      return NextResponse.json({ message: 'ID parameter harus diisi' }, { status: 400 })
    }
    if (!nama?.trim()) {
      return NextResponse.json({ message: 'Nama parameter harus diisi' }, { status: 400 })
    }
    if (value === undefined || value === null || String(value).trim() === '') {
      return NextResponse.json({ message: 'Value parameter harus diisi' }, { status: 400 })
    }

    const existing = await (prisma as any).masterParameter.findUnique({ where: { id: id.trim() } })

    if (existing) {
      return NextResponse.json({ message: `ID "${id.trim()}" sudah digunakan` }, { status: 409 })
    }

    const data = await (prisma as any).masterParameter.create({
      data: { id: id.trim(), nama: nama.trim(), value: String(value).trim() }
    })

    clearParameterCache(id.trim())

    return NextResponse.json({ data, message: 'Parameter berhasil dibuat' }, { status: 201 })
  } catch (error) {
    console.error('Create parameter error:', error)

    return NextResponse.json({ message: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

export const GET = withAuth(handleGet)
export const POST = withAuth(handlePost)
