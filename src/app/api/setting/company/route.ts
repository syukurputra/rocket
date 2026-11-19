import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import prisma from '@/src/libs/prisma'
import { withAuth, type AuthContext } from '@/src/libs/auth-middleware'

/** Membuang kolom sisa sistem paket dari data company sebelum dikirim. */
function tanpaKolomPaket<T extends { paketId?: unknown; paketStartDate?: unknown; paketEndDate?: unknown; isTrial?: unknown }>(
  company: T
) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { paketId, paketStartDate, paketEndDate, isTrial, ...sisa } = company

  return sisa
}

// GET /api/setting/company - Get company details
async function handleGet(request: NextRequest, { user }: AuthContext) {
  try {
    if (!user.companyId) {
      return NextResponse.json({ message: 'User tidak terkait dengan perusahaan' }, { status: 400 })
    }

    const company = await prisma.company.findUnique({
      where: { id: user.companyId }
    })

    if (!company) {
      return NextResponse.json({ message: 'Company tidak ditemukan' }, { status: 404 })
    }

    return NextResponse.json({
      // Bantu Sewa 100% gratis — kolom sisa paket tidak dikirim lagi ke klien.
      data: tanpaKolomPaket(company),
      message: 'Data perusahaan berhasil diambil'
    })
  } catch (error) {
    console.error('Get company error:', error)

    return NextResponse.json(
      {
        message: 'Terjadi kesalahan server',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// PUT /api/setting/company - Update company details
async function handlePut(request: NextRequest, { user }: AuthContext) {
  try {
    if (!user.companyId) {
      return NextResponse.json({ message: 'User tidak terkait dengan perusahaan' }, { status: 400 })
    }

    const body = await request.json()
    const {
      nama,
      alamat,
      telepon,
      email,
      bankPenerima,
      nomorRekening,
      rekeningPenerima,
      provinsi,
      kota,
      kecamatan,
      kelurahan,
      latitude,
      longitude
    } = body

    if (!nama) {
      return NextResponse.json({ message: 'Nama perusahaan harus diisi' }, { status: 400 })
    }

    const company = await prisma.company.update({
      where: {
        id: user.companyId
      },
      data: {
        nama,
        alamat: alamat || null,
        telepon: telepon || null,
        email: email || null,
        bankPenerima: bankPenerima || null,
        nomorRekening: nomorRekening || null,
        rekeningPenerima: rekeningPenerima || null,
        provinsi: provinsi || null,
        kota: kota || null,
        kecamatan: kecamatan || null,
        kelurahan: kelurahan || null,
        latitude: latitude ?? null,
        longitude: longitude ?? null
      }
    })

    return NextResponse.json({
      data: tanpaKolomPaket(company),
      message: 'Perusahaan berhasil diperbarui'
    })
  } catch (error) {
    console.error('Update company error:', error)

    return NextResponse.json(
      {
        message: 'Terjadi kesalahan server',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export const GET = withAuth(handleGet)
export const PUT = withAuth(handlePut)
