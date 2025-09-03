import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/src/libs/prisma'
import { withAuth, type AuthContext } from '@/src/libs/auth-middleware'

type ParamCtx = AuthContext & { params: { id: string } }

async function handleGet(
  _req: NextRequest, 
  { params }: ParamCtx
) {
  try {
    const { id } = params

    const keuangan = await prisma.keuangan.findUnique({
      where: { id },
      include: {
        createdBy: { select: { id: true, username: true } },
        updatedBy: { select: { id: true, username: true } }
      }
    })

    if (!keuangan) return NextResponse.json({ message: 'Keuangan tidak ditemukan' }, { status: 404 })

    return NextResponse.json({ data: keuangan, message: 'Data retrieved successfully' })
  } catch (error) {
    console.error('Get keuangan by ID error:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

async function handlePut(
  req: NextRequest, 
  { user, params }: ParamCtx
) {
  try {
    const { id } = params
    const body = await req.json()
    const { jenis, keterangan, nominal, asetId, iconId, tanggal } = body

    let transactionDate = tanggal ? new Date(tanggal) : new Date()
    if (isNaN(transactionDate.getTime())) {
      return NextResponse.json({ message: 'Format tanggal tidak valid' }, { status: 400 })
    }

    const existing = await prisma.keuangan.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ message: 'Keuangan tidak ditemukan' }, { status: 404 })

    const nominalValue = typeof nominal === 'string' ? parseFloat(nominal.replace(/,/g, '')) : Number(nominal)
    if (!Number.isFinite(nominalValue)) return NextResponse.json({ message: 'Nominal tidak valid' }, { status: 400 })

    const updated = await prisma.keuangan.update({
      where: { id },
      data: {
        jenis,
        keterangan: keterangan || '',
        nominal: nominalValue,
        asetId,
        iconId,
        tanggal: transactionDate,
        updatedById: user.id
      },
      include: {
        createdBy: { select: { id: true, username: true } },
        updatedBy: { select: { id: true, username: true } }
      }
    })

    return NextResponse.json({ data: updated, message: 'Keuangan berhasil diupdate' })
  } catch (error) {
    console.error('Update keuangan error:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

async function handleDelete(
  _req: NextRequest, 
  { params }: ParamCtx
) {
  try {
    const { id } = params

    const existing = await prisma.keuangan.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ message: 'Keuangan tidak ditemukan' }, { status: 404 })

    await prisma.keuangan.delete({ where: { id } })
    return NextResponse.json({ message: 'Keuangan berhasil dihapus' })
  } catch (error) {
    console.error('Delete keuangan error:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

export const GET    = withAuth<{ id: string }>(handleGet)
export const PUT    = withAuth<{ id: string }>(handlePut)
export const DELETE = withAuth<{ id: string }>(handleDelete)