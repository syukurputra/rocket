import { NextResponse } from 'next/server'

import swaggerSpec from '@/src/lib/swagger'

export const dynamic = 'force-dynamic'

export function GET() {
  return NextResponse.json(swaggerSpec)
}
