import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import prisma from '@/src/libs/prisma'

// GET /api/aset/check-slug?publishId=xxx&excludeId=yyy
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const publishId = searchParams.get('publishId')?.trim()
  const excludeId = searchParams.get('excludeId')

  if (!publishId) {
    return NextResponse.json({ available: false, message: 'publishId diperlukan' }, { status: 400 })
  }

  const slugPattern = /^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$/
  if (!slugPattern.test(publishId)) {
    return NextResponse.json({ available: false, message: 'Format tidak valid' })
  }

  // Pakai raw SQL agar tidak bergantung pada Prisma Client yang di-generate
  const rows = excludeId
    ? await prisma.$queryRaw<{ id: string }[]>`SELECT id FROM aset WHERE "publishId" = ${publishId} AND id != ${excludeId}`
    : await prisma.$queryRaw<{ id: string }[]>`SELECT id FROM aset WHERE "publishId" = ${publishId}`

  return NextResponse.json({ available: rows.length === 0 })
}
