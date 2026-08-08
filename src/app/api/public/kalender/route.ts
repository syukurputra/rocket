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
        itemAsetId: ruanganId,
        status: 'LUNAS',
        selesaiSewa: { gte: today },
        mulaiSewa: { lte: maxDate }
      },
      include: {
        ruangan: { select: { id: true, nama: true } }
      },
      orderBy: { mulaiSewa: 'asc' }
    })

    const events = tagihanList.map(t => {
      const allDay = t.periodeSewa !== 'jam'

      // `end` pada event allDay bersifat eksklusif di FullCalendar, sedangkan
      // selesaiSewa kita inklusif — ditambah satu hari agar hari terakhir ikut
      // tertandai sebagai tanggal yang sudah terpakai.
      const endTampilan = new Date(t.selesaiSewa)

      if (allDay) endTampilan.setDate(endTampilan.getDate() + 1)

      return {
        id: t.id,
        title: 'Booking',
        start: t.mulaiSewa,
        end: endTampilan,
        allDay,
        extendedProps: {
          color: 'error',
          itemAset: t.ruangan?.nama ?? '',
          status: t.status,
          periodeSewa: t.periodeSewa,
          selesaiSewa: t.selesaiSewa
        }
      }
    })

    return NextResponse.json({ data: events })
  } catch (error) {
    console.error('Public kalender error:', error)
    return NextResponse.json({ message: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
