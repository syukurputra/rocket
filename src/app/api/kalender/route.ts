import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import prisma from '@/src/libs/prisma'
import { withAuth, type AuthContext } from '@/src/libs/auth-middleware'
import { STATUS_TAGIHAN } from '@/src/libs/orderPayment'

async function handleGet(_request: NextRequest, { user }: AuthContext) {
  try {
    if (!user.companyId) {
      return NextResponse.json({ data: [] })
    }

    // Kalender hanya menampilkan booking yang sudah lunas. Yang belum terbayar,
    // menunggu konfirmasi, atau dibatalkan belum memakai jadwal.
    const tagihanList = await prisma.tagihan.findMany({
      where: { companyId: user.companyId, status: STATUS_TAGIHAN.lunas },
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

      // Sewa per jam ditampilkan sebagai rentang waktu, sisanya sebagai hari penuh
      const allDay = t.periodeSewa !== 'jam'

      // Untuk sewa berbasis tanggal, mulaiSewa & selesaiSewa tersimpan pada jam
      // 00:00. Kalau dibandingkan apa adanya, booking yang berakhir HARI INI
      // sudah dianggap selesai sejak pagi. Karena itu batasnya dilebarkan ke
      // awal & akhir hari. Sewa per jam tetap dibandingkan persis.
      const batasMulai = new Date(mulai)
      const batasSelesai = new Date(selesai)

      if (allDay) {
        batasMulai.setHours(0, 0, 0, 0)
        batasSelesai.setHours(23, 59, 59, 999)
      }

      let color: string

      if (batasSelesai < now) {
        color = 'warning'
      } else if (batasMulai <= now) {
        color = 'success'
      } else {
        color = 'primary'
      }

      // FullCalendar memperlakukan `end` pada event allDay sebagai EKSKLUSIF —
      // hari terakhir tidak ikut terwarnai. Karena selesaiSewa kita inklusif,
      // tanggalnya ditambah satu hari khusus untuk keperluan tampilan.
      const endTampilan = new Date(selesai)

      if (allDay) endTampilan.setDate(endTampilan.getDate() + 1)

      return {
        id: t.id,
        title: `${t.penyewa?.nama ?? '-'} - ${t.ruangan?.nama ?? ''}`,
        start: t.mulaiSewa,
        end: endTampilan,
        allDay,
        extendedProps: {
          color,
          aset: t.aset?.nama ?? '',
          itemAset: t.ruangan?.nama ?? '',
          status: t.status,
          periodeSewa: t.periodeSewa,

          // Tanggal selesai sebenarnya, dipakai dialog detail
          selesaiSewa: t.selesaiSewa
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
