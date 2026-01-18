import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import prisma from '@/src/libs/prisma'

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const id = url.searchParams.get('token') || ''

    console.log('Verification attempt for token:', id)

    if (!id) {
      console.error('No token provided')
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

      return NextResponse.redirect(`${baseUrl}/verifikasi-gagal`)
    }

    const user = await prisma.user.findUnique({ where: { id } })

    if (!user) {
      console.error('User not found for token:', id)
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

      return NextResponse.redirect(`${baseUrl}/verifikasi-gagal`)
    }

    console.log('Updating verification status for user:', user.username)

    await prisma.user.update({
      where: { id },
      data: { verifikasi: true }
    })

    console.log('Verification successful for user:', user.username)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    return NextResponse.redirect(`${baseUrl}/verifikasi-berhasil`)
  } catch (err) {
    console.error('Verification error:', err)

    return NextResponse.json({ message: 'Terjadi kesalahan', error: (err as Error).message }, { status: 500 })
  }
}
