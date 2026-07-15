import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import prisma from '@/src/libs/prisma'
import { withAuth, type AuthContext } from '@/src/libs/auth-middleware'

type RekonRow = {
  refId: string
  amount: number
  fee: number
  type: string
  paymentChannel: string
  paymentNo: string
  status: string
}

const BERHASIL_STATUSES = ['berhasil', 'success', 'paid', 'settlement']

async function saveRekonFields(tagihanId: string, amount: number, fee: number, type: string, channel: string, paymentNo: string) {
  await prisma.$executeRaw`
    UPDATE "tagihan"
    SET
      "statusRekon"      = 'SESUAI',
      "amountPembayaran" = ${amount}::numeric,
      "amountFee"        = ${fee}::numeric,
      "typePembayaran"   = ${type},
      "paymentChannel"   = ${channel},
      "paymentNo"        = ${paymentNo},
      "updatedAt"        = NOW()
    WHERE id = ${tagihanId}
  `
}

async function markLunas(tagihanId: string, updatedById: string, amount: number, fee: number, type: string, channel: string, paymentNo: string) {
  await prisma.$executeRaw`
    UPDATE "tagihan"
    SET
      "status"           = 'LUNAS',
      "metodeBayar"      = 'ipaymu',
      "statusRekon"      = 'SESUAI',
      "amountPembayaran" = ${amount}::numeric,
      "amountFee"        = ${fee}::numeric,
      "typePembayaran"   = ${type},
      "paymentChannel"   = ${channel},
      "paymentNo"        = ${paymentNo},
      "updatedById"      = ${updatedById},
      "updatedAt"        = NOW()
    WHERE id = ${tagihanId}
  `
}

async function handlePost(request: NextRequest, { user }: AuthContext) {
  try {
    const isSuperAdmin =
      user.roleId === 'superadmin' ||
      user.role?.nama?.toLowerCase().replace(/\s+/g, '') === 'superadmin'

    if (!isSuperAdmin) {
      return NextResponse.json({ message: 'Akses ditolak' }, { status: 403 })
    }

    const body = await request.json()
    const rows: RekonRow[] = body.rows || []

    if (!rows.length) {
      return NextResponse.json({ message: 'Data rekon kosong' }, { status: 400 })
    }

    const results: { refId: string; matched: boolean; updated: boolean; prevStatus?: string; reason?: string }[] = []
    let updatedCount = 0
    let matchedCount = 0

    for (const row of rows) {
      const { refId, amount, fee, type, paymentChannel, paymentNo, status } = row

      // Tagihan matched by id langsung (tagihanId = refId)
      const tagihan = await prisma.tagihan.findUnique({ where: { id: refId } })

      if (!tagihan) {
        results.push({ refId, matched: false, updated: false, reason: 'Tagihan tidak ditemukan' })
        continue
      }

      matchedCount++

      const isBerhasil = BERHASIL_STATUSES.includes((status || '').toLowerCase().trim())

      if (!isBerhasil) {
        await saveRekonFields(tagihan.id, amount, fee, type, paymentChannel, paymentNo)
        results.push({ refId, matched: true, updated: false, prevStatus: tagihan.status, reason: `Status iPaymu bukan Berhasil: "${status}"` })
        continue
      }

      if (tagihan.status === 'LUNAS') {
        await saveRekonFields(tagihan.id, amount, fee, type, paymentChannel, paymentNo)
        results.push({ refId, matched: true, updated: false, prevStatus: tagihan.status, reason: 'Sudah LUNAS sebelumnya' })
        continue
      }

      await markLunas(tagihan.id, user.id, amount, fee, type, paymentChannel, paymentNo)
      updatedCount++
      results.push({ refId, matched: true, updated: true, prevStatus: tagihan.status })
    }

    return NextResponse.json({
      data: { total: rows.length, matched: matchedCount, updated: updatedCount, unmatched: rows.length - matchedCount, results },
      message: `Rekon selesai: ${updatedCount} tagihan diupdate ke LUNAS dari ${matchedCount} yang cocok`
    })
  } catch (error) {
    console.error('Tagihan rekon error:', error)

    return NextResponse.json({ message: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

export const POST = withAuth(handlePost)
