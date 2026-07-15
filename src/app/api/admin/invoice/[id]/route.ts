import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import prisma from '@/src/libs/prisma'
import { withAuth, type AuthContext } from '@/src/libs/auth-middleware'

type ParamCtx = AuthContext & { params: { id: string } }

async function handlePatch(request: NextRequest, { user, params }: ParamCtx) {
  try {
    const isSuperAdmin =
      user.roleId === 'superadmin' ||
      user.role?.nama?.toLowerCase().replace(/\s+/g, '') === 'superadmin'

    if (!isSuperAdmin) {
      return NextResponse.json({ message: 'Akses ditolak' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const { status, catatan } = body

    const invoice = await prisma.invoice.findUnique({ where: { id } })

    if (!invoice) {
      return NextResponse.json({ message: 'Invoice tidak ditemukan' }, { status: 404 })
    }

    const updated = await prisma.invoice.update({
      where: { id },
      data: {
        status,
        ...(status === 'PAID' && { tanggalBayar: new Date() }),
        ...(catatan && { catatan })
      }
    })

    if (status === 'PAID' && invoice.companyId && invoice.paketId) {
      const startDate = new Date()
      const endDate = new Date(startDate)

      if (invoice.billingCycle === 'annually') {
        endDate.setFullYear(endDate.getFullYear() + 1)
      } else {
        endDate.setMonth(endDate.getMonth() + 1)
      }

      await prisma.company.update({
        where: { id: invoice.companyId },
        data: { paketId: invoice.paketId, paketStartDate: startDate, paketEndDate: endDate }
      })
    }

    return NextResponse.json({ data: updated, message: 'Invoice berhasil diupdate' })
  } catch (error) {
    console.error('Admin invoice patch error:', error)

    return NextResponse.json({ message: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

export const PATCH = withAuth<{ id: string }>(handlePatch)
