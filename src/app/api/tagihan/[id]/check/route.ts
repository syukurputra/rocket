import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import prisma from '@/src/libs/prisma'
import { withAuth, type AuthContext } from '@/src/libs/auth-middleware'
import { checkIpaymuTransaction } from '@/src/libs/ipaymu'

async function handlePost(request: NextRequest, { params, user }: AuthContext & { params: { id: string } }) {
  try {
    const { id } = params

    const tagihan = await prisma.tagihan.findUnique({ where: { id } })

    if (!tagihan) {
      return NextResponse.json({ message: 'Tagihan tidak ditemukan' }, { status: 404 })
    }

    if (tagihan.status === 'LUNAS') {
      return NextResponse.json({ message: 'Tagihan sudah lunas', data: tagihan })
    }

    if (!tagihan.ipaymuSessionId) {
      return NextResponse.json({ message: 'Belum ada transaksi iPaymu untuk tagihan ini' }, { status: 400 })
    }

    const ipaymuData = await checkIpaymuTransaction(tagihan.ipaymuSessionId)

    console.log('[iPaymu Check Tagihan] Result:', ipaymuData)

    const statusCode = ipaymuData.Data?.Status

    let newStatus = tagihan.status

    if (statusCode === 1 || statusCode === 6) {
      newStatus = 'LUNAS'
    } else if (statusCode === -2) {
      newStatus = 'EXPIRED'
    }

    if (newStatus !== tagihan.status) {
      await prisma.tagihan.update({
        where: { id },
        data: {
          status: newStatus,
          metodeBayar: 'ipaymu',
          updatedById: user.id
        }
      })
    }

    const statusLabel: Record<number, string> = { 1: 'LUNAS', 6: 'LUNAS', 0: 'PENDING', [-2]: 'EXPIRED' }
    const label = statusLabel[statusCode] ?? 'PENDING'

    return NextResponse.json({
      message: `Status transaksi: ${label}`,
      data: { ...tagihan, status: newStatus }
    })
  } catch (error) {
    console.error('Check tagihan error:', error)

    return NextResponse.json({
      message: error instanceof Error ? error.message : 'Terjadi kesalahan server'
    }, { status: 500 })
  }
}

export const POST = withAuth(handlePost)
