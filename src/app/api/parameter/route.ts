import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { getParameter } from '@/src/libs/getParameter'
import { withAuth, type AuthContext } from '@/src/libs/auth-middleware'

// GET /api/parameter?id=COMPANY_SUPER
// GET /api/parameter?ids=ADMIN_BOOKING_1,ADMIN_BOOKING_2  → { data: { id: value } }
async function handleGet(request: NextRequest, _ctx: AuthContext) {
  const { searchParams } = new URL(request.url)
  const ids = searchParams.get('ids') || ''

  if (ids) {
    const list = ids
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)

    if (!list.length) {
      return NextResponse.json({ message: 'Parameter ids diperlukan' }, { status: 400 })
    }

    const entries = await Promise.all(list.map(async pid => [pid, await getParameter(pid)] as const))

    // id yang tidak ketemu dikembalikan sebagai string kosong, bukan 404,
    // supaya pemanggil bisa memakai nilai default-nya sendiri
    return NextResponse.json({ data: Object.fromEntries(entries) })
  }

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
