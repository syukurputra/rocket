import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import prisma from '@/src/libs/prisma'
import { withAuth, type AuthContext } from '@/src/libs/auth-middleware'

async function handleGet(_request: NextRequest, { user }: AuthContext) {
  try {
    if (!user.companyId) {
      return NextResponse.json({ data: [] })
    }

    const tagihanList = await prisma.tagihan.findMany({
      where: { companyId: user.companyId },
      include: {
        penyewa: { select: { id: true, nama: true } },
        aset: { select: { id: true, nama: true } },
        ruangan: { select: { id: true, nama: true } }
      },
      orderBy: { mulaiSewa: 'asc' }
    })

    const events = tagihanList.map(t => {
      const now = new Date()
      const mulai = new Date(t.mulaiSewa)
      const selesai = new Date(t.selesaiSewa)

      let color: string
      if (selesai < now) {
        color = 'warning'
      } else if (mulai <= now && selesai >= now) {
        color = 'success'
      } else {
        color = 'primary'
      }

      return {
        id: t.id,
        title: `${t.penyewa?.nama ?? '-'} - ${t.ruangan?.nama ?? ''}`,
        start: t.mulaiSewa,
        end: t.selesaiSewa,
        allDay: true,
        extendedProps: {
          color,
          aset: t.aset?.nama ?? '',
          ruangan: t.ruangan?.nama ?? '',
          status: t.status,
          periodeSewa: t.periodeSewa
        }
      }
    })

    return NextResponse.json({ data: events })
  } catch (error) {
    console.error('Kalender error:', error)
    return NextResponse.json({ message: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

export const GET = withAuth(handleGet)
