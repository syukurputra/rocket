import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { getParameter } from '@/src/libs/getParameter'
import { withAuth, type AuthContext } from '@/src/libs/auth-middleware'

// GET /api/parameter?id=COMPANY_SUPER
async function handleGet(request: NextRequest, _ctx: AuthContext) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id') || ''

  if (!id) {
    return NextResponse.json({ message: 'Parameter id diperlukan' }, { status: 400 })
  }

  const value = await getParameter(id)

  if (!value) {
    return NextResponse.json({ message: `Parameter "${id}" tidak ditemukan` }, { status: 404 })
  }

  return NextResponse.json({ data: { id, value } })
}

export const GET = withAuth(handleGet)
