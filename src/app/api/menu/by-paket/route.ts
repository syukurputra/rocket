import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { withAuth, type AuthContext } from '@/src/libs/auth-middleware'
import { ambilMenuUntukCompany } from '@/src/libs/menuTenant'

/**
 * GET /api/menu/by-paket - Menu yang tersedia untuk company pengguna.
 *
 * Nama rute dipertahankan agar klien lama tetap jalan, tetapi isinya tidak
 * lagi bergantung pada paket: Bantu Sewa 100% gratis, semua usaha mendapat
 * menu yang sama.
 */
async function handleGet(_request: NextRequest, { user }: AuthContext) {
  try {
    const menus = await ambilMenuUntukCompany(user.companyId)

    return NextResponse.json({
      data: menus,
      message: 'Data menu berhasil diambil'
    })
  } catch (error) {
    console.error('Get menus error:', error)

    return NextResponse.json({ message: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

export const GET = withAuth(handleGet)
