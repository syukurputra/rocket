import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import prisma from '@/src/libs/prisma'
import { withAuth, type AuthContext } from '@/src/libs/auth-middleware'

// DELETE /api/keranjang/[id] — hapus satu item dari keranjang
async function handleDelete(_request: NextRequest, { params, user }: AuthContext & { params: { id: string } }) {
  try {
    const { id } = params

    const item = await prisma.keranjang.findUnique({ where: { id } })

    if (!item || item.userId !== user.id) {
      return NextResponse.json({ message: 'Item keranjang tidak ditemukan' }, { status: 404 })
    }

    await prisma.keranjang.delete({ where: { id } })

    const jumlahItem = await prisma.keranjang.count({ where: { userId: user.id } })

    return NextResponse.json({ data: { jumlahItem }, message: 'Item berhasil dihapus dari keranjang' })
  } catch (error) {
    console.error('Delete keranjang error:', error)

    return NextResponse.json({ message: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

export const DELETE = withAuth(handleDelete)
