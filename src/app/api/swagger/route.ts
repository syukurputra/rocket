import { NextResponse } from 'next/server'

import swaggerSpec from '@/src/lib/swagger'

export const dynamic = 'force-dynamic'

export function GET() {
  // Jangan buka daftar API ke publik di production, kecuali diaktifkan lewat env
  if (process.env.NODE_ENV === 'production' && process.env.ENABLE_API_DOCS !== 'true') {
    return NextResponse.json({ message: 'Not found' }, { status: 404 })
  }

  return NextResponse.json(swaggerSpec)
}
