import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import prisma from '@/src/libs/prisma'
import { withAuth, type AuthContext } from '@/src/libs/auth-middleware'

async function handleGet(request: NextRequest, { user }: AuthContext) {
  try {
    const penyewaList = await prisma.penyewa.findMany({
      where: { companyId: user.companyId },
      include: {
        aset: { select: { id: true, nama: true, jenis: true } },
        ruangan: { select: { id: true, nama: true } }
      },
      orderBy: { mulaiSewa: 'asc' }
    })

    const events = penyewaList.map(p => {
      const now = new Date()
      const mulai = new Date(p.mulaiSewa)
      const selesai = new Date(p.selesaiSewa)

      // Warna berdasarkan status waktu
      let color: string
      if (selesai < now) {
        color = 'warning' // sudah selesai
      } else if (mulai <= now && selesai >= now) {
        color = 'success' // sedang berjalan
      } else {
        color = 'primary' // akan datang
      }

      return {
        id: p.id,
        title: `${p.nama} - ${p.ruangan?.nama ?? ''}`,
        start: p.mulaiSewa,
        end: p.selesaiSewa,
        allDay: true,
        extendedProps: {
          color,
          aset: p.aset?.nama ?? '',
          ruangan: p.ruangan?.nama ?? '',
          status: p.status,
          periodeSewa: p.periodeSewa
        }
      }
    })

    return NextResponse.json({ data: events })
  } catch (error) {
    console.error('Kalender error:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

export const GET = withAuth(handleGet)
