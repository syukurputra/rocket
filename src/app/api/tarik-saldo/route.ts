import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'

import prisma from '@/src/libs/prisma'
import { withAuth, type AuthContext } from '@/src/libs/auth-middleware'
import { getParameter } from '@/src/libs/getParameter'

export const runtime = 'nodejs'

// GET /api/tarik-saldo — riwayat penarikan saldo company
async function handleGet(_request: NextRequest, { user }: AuthContext) {
  try {
    if (!user.companyId) {
      return NextResponse.json({ data: [] })
    }

    const rows = await prisma.$queryRaw<
      {
        id: string
        jumlahTransaksi: number
        jumlahNominal: any
        biayaLayanan: any
        nilaiTransfer: any
        status: string
        tanggalRequest: Date
        createdAt: Date
      }[]
    >`
      SELECT id, "jumlahTransaksi", "jumlahNominal", "biayaLayanan", "nilaiTransfer", status, "tanggalRequest", "createdAt"
      FROM "tarik_saldo"
      WHERE "companyId" = ${user.companyId}
      ORDER BY "tanggalRequest" DESC
    `

    const data = rows.map(r => ({
      id: r.id,
      jumlahTransaksi: Number(r.jumlahTransaksi ?? 0),
      jumlahNominal: Number(r.jumlahNominal ?? 0),
      biayaLayanan: Number(r.biayaLayanan ?? 0),
      nilaiTransfer: Number(r.nilaiTransfer ?? 0),
      status: r.status,
      tanggalRequest: r.tanggalRequest,
      createdAt: r.createdAt
    }))

    return NextResponse.json({ data, message: 'Data berhasil diambil' })
  } catch (error) {
    console.error('Get tarik saldo history error:', error)

    return NextResponse.json({ message: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

// POST /api/tarik-saldo  { tagihanIds: string[] }
async function handlePost(request: NextRequest, { user }: AuthContext) {
  try {
    if (!user.companyId) {
      return NextResponse.json({ message: 'User tidak terkait dengan perusahaan' }, { status: 400 })
    }

    // Wajib: informasi rekening penerima harus lengkap sebelum bisa tarik saldo.
    const company = await prisma.company.findUnique({
      where: { id: user.companyId },
      select: { bankPenerima: true, nomorRekening: true, rekeningPenerima: true }
    })

    if (!company?.bankPenerima || !company?.nomorRekening || !company?.rekeningPenerima) {
      return NextResponse.json(
        { message: 'Lengkapi informasi rekening penerima (Bank, Nomor Rekening, Nama Penerima) sebelum melakukan tarik saldo.' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const tagihanIds: string[] = Array.isArray(body?.tagihanIds) ? body.tagihanIds : []

    if (tagihanIds.length === 0) {
      return NextResponse.json({ message: 'Pilih minimal satu transaksi' }, { status: 400 })
    }

    // Ambil hanya tagihan yang valid: milik company, SESUAI, belum ditarik
    const eligible = await prisma.$queryRaw<{ id: string; hargaMerchant: any }[]>`
      SELECT id, "hargaMerchant" FROM "tagihan"
      WHERE "companyId" = ${user.companyId}
        AND "statusRekon" = 'SESUAI'
        AND "tarikSaldoId" IS NULL
        AND id = ANY(${tagihanIds}::text[])
    `

    if (eligible.length === 0) {
      return NextResponse.json({ message: 'Tidak ada transaksi valid untuk ditarik' }, { status: 400 })
    }

    const jumlahTransaksi = eligible.length
    const jumlahNominal = eligible.reduce((sum, t) => sum + Number(t.hargaMerchant ?? 0), 0)
    const validIds = eligible.map(t => t.id)

    // Snapshot biaya layanan saat request dibuat, supaya histori tidak berubah
    // kalau parameter ADMIN_TARIK_SALDO diubah di kemudian hari.
    const biayaLayanan = Number((await getParameter('ADMIN_TARIK_SALDO', '0')) || '0')
    const nilaiTransfer = jumlahNominal - biayaLayanan

    const tarikSaldoId = randomUUID()

    // Buat record tarik saldo
    await prisma.$executeRaw`
      INSERT INTO "tarik_saldo" ("id", "companyId", "jumlahTransaksi", "jumlahNominal", "biayaLayanan", "nilaiTransfer", "status", "tanggalRequest", "createdById", "createdAt", "updatedAt")
      VALUES (${tarikSaldoId}, ${user.companyId}, ${jumlahTransaksi}, ${jumlahNominal}, ${biayaLayanan}, ${nilaiTransfer}, 'PENDING', NOW(), ${user.id}, NOW(), NOW())
    `

    // Tandai tagihan sebagai sudah masuk penarikan
    await prisma.$executeRaw`
      UPDATE "tagihan" SET "tarikSaldoId" = ${tarikSaldoId}
      WHERE id = ANY(${validIds}::text[])
    `

    return NextResponse.json(
      {
        data: { id: tarikSaldoId, jumlahTransaksi, jumlahNominal, biayaLayanan, nilaiTransfer },
        message: 'Penarikan saldo berhasil dibuat'
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Create tarik saldo error:', error)

    return NextResponse.json({ message: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

export const GET = withAuth(handleGet)
export const POST = withAuth(handlePost)
