import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import prisma from '@/src/libs/prisma'
import { withAuth, type AuthContext } from '@/src/libs/auth-middleware'

async function handlePut(request: NextRequest, { params }: AuthContext & { params: { id: string } }) {
  try {
    const body = await request.json()
    const { nama, status } = body

    if (!nama) {
      return NextResponse.json({ message: 'Nama jenis aset harus diisi' }, { status: 400 })
    }

    const data = await prisma.masterJenisAset.update({
      where: { id: params.id },
      data: { nama, status }
    })

    return NextResponse.json({ data, message: 'Jenis aset berhasil diupdate' })
  } catch (error) {
    console.error('Update jenis aset error:', error)

    return NextResponse.json({ message: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

async function handleDelete(_request: NextRequest, { params }: AuthContext & { params: { id: string } }) {
  try {
    await prisma.masterJenisAset.delete({ where: { id: params.id } })

    return NextResponse.json({ message: 'Jenis aset berhasil dihapus' })
  } catch (error) {
    console.error('Delete jenis aset error:', error)

    return NextResponse.json({ message: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

export const PUT = withAuth(handlePut)
export const DELETE = withAuth(handleDelete)
