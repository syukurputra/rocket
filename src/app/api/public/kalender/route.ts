import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import prisma from '@/src/libs/prisma'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const ruanganId = searchParams.get('ruanganId')

    if (!ruanganId) {
      return NextResponse.json({ data: [] })
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const maxDate = new Date(today)
    maxDate.setMonth(maxDate.getMonth() + 3)

    const tagihanList = await prisma.tagihan.findMany({
      where: {
        ruanganId,
        status: 'LUNAS',
        selesaiSewa: { gte: today },
        mulaiSewa: { lte: maxDate }
      },
      include: {
        ruangan: { select: { id: true, nama: true } }
      },
      orderBy: { mulaiSewa: 'asc' }
    })

    const events = tagihanList.map(t => ({
      id: t.id,
      title: 'Booking',
      start: t.mulaiSewa,
      end: t.selesaiSewa,
      allDay: true,
      extendedProps: {
        color: 'error',
        itemAset: t.ruangan?.nama ?? '',
        status: t.status,
        periodeSewa: t.periodeSewa
      }
    }))

    return NextResponse.json({ data: events })
  } catch (error) {
    console.error('Public kalender error:', error)
    return NextResponse.json({ message: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
