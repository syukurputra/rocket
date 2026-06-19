import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { withAuth, type AuthContext } from '@/src/libs/auth-middleware'
import { syncWilayahByProvinceId } from '@/src/jobs/wilayahSyncJob'

// POST /api/admin/sync-wilayah
// Body: { provinceId: string }
// Trigger sync wilayah manual untuk satu provinsi tertentu
async function handlePost(request: NextRequest, { user }: AuthContext) {
  if (user.role?.nama !== 'Super Admin') {
    return NextResponse.json({ message: 'Tidak diizinkan. Akses Super Admin diperlukan.' }, { status: 403 })
  }

  let body: { provinceId?: string }

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ message: 'Body request tidak valid.' }, { status: 400 })
  }

  const { provinceId } = body

  if (!provinceId || typeof provinceId !== 'string' || !provinceId.trim()) {
    return NextResponse.json({ message: 'Parameter provinceId wajib diisi.' }, { status: 400 })
  }

  try {
    const result = await syncWilayahByProvinceId(provinceId.trim())

    return NextResponse.json({
      message: result.message,
      data: {
        addedProvinces: result.addedProvinces,
        addedCities: result.addedCities,
        addedDistricts: result.addedDistricts,
        addedVillages: result.addedVillages,
        skipped: result.skipped
      }
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Terjadi kesalahan server.'

    console.error('[sync-wilayah]', error)

    return NextResponse.json({ message }, { status: 500 })
  }
}

export const POST = withAuth(handlePost)
