import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import prisma from '@/src/libs/prisma'
import { withAuth, type AuthContext } from '@/src/libs/auth-middleware'

type ParamCtx = AuthContext & { params: { id: string } }

// PATCH /api/notifikasi/[id] - Tandai baca/belum baca
async function handlePatch(request: NextRequest, { user, params }: ParamCtx) {
  try {
    const { id } = params
    const body = await request.json()
    const { read } = body

    const notif = await prisma.notifikasi.findUnique({ where: { id } })

    if (!notif || notif.userId !== user.id) {
      return NextResponse.json({ message: 'Notifikasi tidak ditemukan' }, { status: 404 })
    }

    const updated = await prisma.notifikasi.update({
      where: { id },
      data: { read: read ?? true }
    })

    return NextResponse.json({ data: updated })
  } catch (error) {
    console.error('Update notifikasi error:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/notifikasi/[id] - Hapus notifikasi
async function handleDelete(_request: NextRequest, { user, params }: ParamCtx) {
  try {
    const { id } = params

    const notif = await prisma.notifikasi.findUnique({ where: { id } })

    if (!notif || notif.userId !== user.id) {
      return NextResponse.json({ message: 'Notifikasi tidak ditemukan' }, { status: 404 })
    }

    await prisma.notifikasi.delete({ where: { id } })

    return NextResponse.json({ message: 'Notifikasi dihapus' })
  } catch (error) {
    console.error('Delete notifikasi error:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

export const PATCH = withAuth<{ id: string }>(handlePatch)
export const DELETE = withAuth<{ id: string }>(handleDelete)
