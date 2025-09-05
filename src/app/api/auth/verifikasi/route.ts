import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/src/libs/prisma'

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const id = url.searchParams.get('token') || ''

    const user = await prisma.user.findUnique({ where: { id } })
    if (!user) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/id/verifikasi-gagal`)
    }

    await prisma.user.update({
      where: { id },
      data: { verifikasi: true }
    })

    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/id/verifikasi-berhasil`)
  } catch (err) {
    return NextResponse.json({ message: 'Terjadi kesalahan', error: (err as Error).message }, { status: 500 })
  }
}
