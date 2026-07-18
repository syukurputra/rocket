import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import prisma from '@/src/libs/prisma'
import { withAuth, type AuthContext } from '@/src/libs/auth-middleware'
import { sendPaymentConfirmationEmail } from '@/src/mails/paymentConfirmationEmail'
import { createPendapatan } from '@/src/libs/pendapatanService'

type ParamCtx = AuthContext & { params: { id: string } }

async function handleGet(request: NextRequest, { params }: ParamCtx) {
  try {
    const { id } = await params

    const tagihan = await prisma.tagihan.findUnique({
      where: { id },
      include: {
        penyewa: {
          select: {
            id: true,
            nama: true,
            email: true
          }
        },
        createdBy: {
          select: {
            id: true,
            username: true
          }
        },
        updatedBy: {
          select: {
            id: true,
            username: true
          }
        }
      }
    })

    if (!tagihan) {
      return NextResponse.json({ message: 'Tagihan tidak ditemukan' }, { status: 404 })
    }

    return NextResponse.json({
      data: tagihan,
      message: 'Data berhasil diambil'
    })
  } catch (error) {
    console.error('Get tagihan by ID error:', error)

    return NextResponse.json({ message: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

async function handlePut(request: NextRequest, { user, params }: ParamCtx) {
  try {
    const { id } = await params
    const body = await request.json()
    const { keterangan, periodeSewa, mulaiSewa, selesaiSewa, status, nominal, metodeBayar, buktiPembayaran, asetId, ruanganId } = body

    const existingTagihan = await prisma.tagihan.findUnique({
      where: { id },
      include: {
        penyewa: {
          select: {
            id: true,
            nama: true,
            email: true
          }
        }
      }
    })

    if (!existingTagihan) {
      return NextResponse.json({ message: 'Tagihan tidak ditemukan' }, { status: 404 })
    }

    let mulaiSewaDate = existingTagihan.mulaiSewa

    if (mulaiSewa) {
      mulaiSewaDate = new Date(mulaiSewa)

      if (isNaN(mulaiSewaDate.getTime())) {
        return NextResponse.json({ message: 'Format tanggal mulai sewa tidak valid' }, { status: 400 })
      }
    }

    let selesaiSewaDate = existingTagihan.selesaiSewa

    if (selesaiSewa) {
      selesaiSewaDate = new Date(selesaiSewa)

      if (isNaN(selesaiSewaDate.getTime())) {
        return NextResponse.json({ message: 'Format tanggal selesai sewa tidak valid' }, { status: 400 })
      }
    }

    const updatedTagihan = await prisma.tagihan.update({
      where: { id },
      data: {
        ...(keterangan && { keterangan }),
        ...(periodeSewa !== undefined && { periodeSewa: periodeSewa || null }),
        ...(mulaiSewa && { mulaiSewa: mulaiSewaDate }),
        ...(selesaiSewa && { selesaiSewa: selesaiSewaDate }),
        ...(status && { status }),
        ...(nominal !== undefined && { nominal }),
        ...(metodeBayar !== undefined && { metodeBayar }),
        ...(buktiPembayaran !== undefined && { buktiPembayaran }),
        ...(asetId !== undefined && { asetId: asetId || null }),
        ...(ruanganId !== undefined && { itemAsetId: ruanganId || null }),
        updatedById: user.id
      },
      include: {
        penyewa: {
          select: {
            id: true,
            nama: true,
            email: true
          }
        },
        createdBy: {
          select: {
            id: true,
            username: true
          }
        },
        updatedBy: {
          select: {
            id: true,
            username: true
          }
        }
      }
    })

    // If status changed to LUNAS, update Penyewa status
    if (status && status.toUpperCase() === 'LUNAS' && existingTagihan.status !== 'LUNAS') {
      // Catat pendapatan
      createPendapatan(id, updatedTagihan.companyId, Number(updatedTagihan.nominal))
        .catch(err => console.error('[Tagihan PUT] Pendapatan error:', err))
    }

    if (status && status.toUpperCase() === 'LUNAS' && updatedTagihan.penyewaId) {
      await prisma.penyewa.update({
        where: { id: updatedTagihan.penyewaId },
        data: {
          status: 'sudah terbayar',
          updatedById: user.id
        }
      })

      // Send email notification if penyewa has email
      if (updatedTagihan.penyewa?.email) {
        try {
          const nomorRows = await prisma.$queryRaw<{ nomorTagihan: string | null }[]>`
            SELECT "nomorTagihan" FROM "tagihan" WHERE id = ${id}
          `
          const nomorTagihan = nomorRows[0]?.nomorTagihan || undefined

          await sendPaymentConfirmationEmail(
            updatedTagihan.penyewa.email,
            updatedTagihan.penyewa.nama,
            updatedTagihan.keterangan,
            updatedTagihan.mulaiSewa.toISOString(),
            updatedTagihan.selesaiSewa.toISOString(),
            Number(updatedTagihan.nominal),
            updatedTagihan.metodeBayar || undefined,
            nomorTagihan
          )
          console.log('Payment confirmation email sent to:', updatedTagihan.penyewa.email)
        } catch (emailError) {
          console.error('Failed to send email notification:', emailError)
        }
      }
    }

    return NextResponse.json({
      data: updatedTagihan,
      message: 'Tagihan berhasil diupdate'
    })
  } catch (error) {
    console.error('Update tagihan error:', error)

    return NextResponse.json({ message: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

async function handleDelete(request: NextRequest, { params }: ParamCtx) {
  try {
    const { id } = await params

    const existingTagihan = await prisma.tagihan.findUnique({
      where: { id }
    })

    if (!existingTagihan) {
      return NextResponse.json({ message: 'Tagihan tidak ditemukan' }, { status: 404 })
    }

    await prisma.tagihan.delete({
      where: { id }
    })

    return NextResponse.json({
      message: 'Tagihan berhasil dihapus'
    })
  } catch (error) {
    console.error('Delete tagihan error:', error)

    return NextResponse.json({ message: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

export const GET = withAuth<{ id: string }>(handleGet)
export const PUT = withAuth<{ id: string }>(handlePut)
export const DELETE = withAuth<{ id: string }>(handleDelete)
