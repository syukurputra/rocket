import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import prisma from '@/src/libs/prisma'
import { withAuth, type AuthContext } from '@/src/libs/auth-middleware'
import { clearParameterCache } from '@/src/libs/getParameter'

async function handlePut(request: NextRequest, { params }: AuthContext & { params: { id: string } }) {
  try {
    const body = await request.json()
    const { id: newId, nama, value } = body

    if (!newId?.trim()) {
      return NextResponse.json({ message: 'ID parameter harus diisi' }, { status: 400 })
    }
    if (!nama?.trim()) {
      return NextResponse.json({ message: 'Nama parameter harus diisi' }, { status: 400 })
    }
    if (value === undefined || value === null || String(value).trim() === '') {
      return NextResponse.json({ message: 'Value parameter harus diisi' }, { status: 400 })
    }

    const cleanId = newId.trim()

    // Jika ID berubah, cek duplikat
    if (cleanId !== params.id) {
      const existing = await (prisma as any).masterParameter.findUnique({ where: { id: cleanId } })

      if (existing) {
        return NextResponse.json({ message: `ID "${cleanId}" sudah digunakan` }, { status: 409 })
      }
    }

    const data = await (prisma as any).masterParameter.update({
      where: { id: params.id },
      data: { id: cleanId, nama: nama.trim(), value: String(value).trim() }
    })

    clearParameterCache(params.id)
    clearParameterCache(cleanId)

    return NextResponse.json({ data, message: 'Parameter berhasil diupdate' })
  } catch (error) {
    console.error('Update parameter error:', error)

    return NextResponse.json({ message: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

async function handleDelete(_request: NextRequest, { params }: AuthContext & { params: { id: string } }) {
  try {
    await (prisma as any).masterParameter.delete({ where: { id: params.id } })

    clearParameterCache(params.id)

    return NextResponse.json({ message: 'Parameter berhasil dihapus' })
  } catch (error) {
    console.error('Delete parameter error:', error)

    return NextResponse.json({ message: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

export const PUT = withAuth(handlePut)
export const DELETE = withAuth(handleDelete)
