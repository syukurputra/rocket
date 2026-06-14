import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import prisma from '@/src/libs/prisma'
import { withAuth, type AuthContext } from '@/src/libs/auth-middleware'

// GET /api/invoice/[id]
async function handleGet(request: NextRequest, { user, params }: AuthContext & { params: { id: string } }) {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: params.id },
      include: {
        paket: {
          select: {
            id: true,
            nama: true,
            deskripsi: true,
            hargaBulanan: true,
            hargaTahunan: true,
            paketMenus: {
              where: { tampilkan: true },
              select: {
                deskripsi: true,
                tampilkan: true,
                menu: { select: { id: true, nama: true, keterangan: true } }
              }
            }
          }
        },
        company: { select: { id: true, nama: true, alamat: true, telepon: true, email: true } },
        createdBy: { select: { id: true, username: true, email: true } }
      }
    })

    if (!invoice) {
      return NextResponse.json({ message: 'Invoice tidak ditemukan' }, { status: 404 })
    }

    // Ensure the invoice belongs to the user's company
    if (invoice.companyId !== user.companyId) {
      return NextResponse.json({ message: 'Akses ditolak' }, { status: 403 })
    }

    return NextResponse.json({ data: invoice, message: 'Invoice berhasil diambil' })
  } catch (error) {
    console.error('Get invoice error:', error)

    return NextResponse.json({ message: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

// PATCH /api/invoice/[id] - Update status or buktiPembayaran invoice
async function handlePatch(request: NextRequest, { user, params }: AuthContext & { params: { id: string } }) {
  try {
    const body = await request.json()
    const { status, buktiPembayaran } = body

    const existing = await prisma.invoice.findUnique({ where: { id: params.id } })

    if (!existing) {
      return NextResponse.json({ message: 'Invoice tidak ditemukan' }, { status: 404 })
    }

    if (existing.companyId !== user.companyId) {
      return NextResponse.json({ message: 'Akses ditolak' }, { status: 403 })
    }

    const updateData: any = {}

    if (status !== undefined) {
      const validStatuses = ['PENDING', 'KONFIRMASI', 'PAID', 'CANCELLED', 'EXPIRED']

      if (!validStatuses.includes(status)) {
        return NextResponse.json({ message: 'Status tidak valid' }, { status: 400 })
      }

      updateData.status = status

      if (status === 'PAID') {
        updateData.tanggalBayar = new Date()
      }
    }

    if (buktiPembayaran !== undefined) {
      updateData.buktiPembayaran = buktiPembayaran
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ message: 'Tidak ada data yang diperbarui' }, { status: 400 })
    }

    const invoice = await prisma.invoice.update({
      where: { id: params.id },
      data: updateData,
      include: {
        paket: { select: { id: true, nama: true } }
      }
    })

    return NextResponse.json({ data: invoice, message: 'Invoice berhasil diperbarui' })
  } catch (error) {
    console.error('Update invoice error:', error)

    return NextResponse.json({ message: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

export const GET = withAuth(handleGet)
export const PATCH = withAuth(handlePatch)
