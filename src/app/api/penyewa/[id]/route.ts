import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import prisma from '@/src/libs/prisma'
import { withAuth, type AuthContext } from '@/src/libs/auth-middleware'

type ParamCtx = AuthContext & { params: { id: string } }

async function handleGet(request: NextRequest, { params }: ParamCtx) {
  try {
    const { id } = params

    const penyewa= await prisma.penyewa.findUnique({
      where: { id },
      include: {
        aset: {
          select: {
            id: true,
            nama: true,
            jenis: true
          }
        },
        ruangan: {
          select: {
            id: true,
            nama: true,
            status: true
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

    if (!penyewa) {
      return NextResponse.json({ message: 'Penyewa tidak ditemukan' }, { status: 404 })
    }

    return NextResponse.json({
      data: penyewa,
      message: 'Data retrieved successfully'
    })
  } catch (error) {
    console.error('Get penyewa by ID error:', error)

    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

async function handlePut(request: NextRequest, { user, params }: ParamCtx) {
  try {
    const { id } = params
    const body = await request.json()
    const { nama, email, nomorTelepon, status, periodeSewa, mulaiSewa, selesaiSewa, asetId, ruanganId, alamat, provinsi, kota, kecamatan, kelurahan, latitude, longitude } = body

    let mulaiSewaDate = new Date()

    if (mulaiSewa) {
      mulaiSewaDate = new Date(mulaiSewa)

      if (isNaN(mulaiSewaDate.getTime())) {
        return NextResponse.json({ message: 'Format tanggal mulai sewa tidak valid' }, { status: 400 })
      }
    }

    let selesaiSewaDate = new Date()

    if (selesaiSewa) {
      selesaiSewaDate = new Date(selesaiSewa)

      if (isNaN(selesaiSewaDate.getTime())) {
        return NextResponse.json({ message: 'Format tanggal selesai sewa tidak valid' }, { status: 400 })
      }
    }

    const existingPenyewa = await prisma.penyewa.findUnique({
      where: { id }
    })

    if (!existingPenyewa) {
      return NextResponse.json({ message: 'Penyewa tidak ditemukan' }, { status: 404 })
    }

    const updatedPenyewa = await prisma.penyewa.update({
      where: { id },
      data: {
        ...(nama && { nama }),
        ...(email !== undefined && { email: email || null }),
        ...(nomorTelepon !== undefined && { nomorTelepon: nomorTelepon || null }),
        ...(alamat !== undefined && { alamat: alamat || null }),
        ...(provinsi !== undefined && { provinsi: provinsi || null }),
        ...(kota !== undefined && { kota: kota || null }),
        ...(kecamatan !== undefined && { kecamatan: kecamatan || null }),
        ...(kelurahan !== undefined && { kelurahan: kelurahan || null }),
        ...(latitude !== undefined && { latitude: latitude || null }),
        ...(longitude !== undefined && { longitude: longitude || null }),
        ...(status && { status }),
        ...(periodeSewa !== undefined && { periodeSewa: periodeSewa || null }),
        ...(mulaiSewa && { mulaiSewa: mulaiSewaDate }),
        ...(selesaiSewa && { selesaiSewa: selesaiSewaDate }),
        ...(asetId && { asetId }),
        ...(ruanganId && { ruanganId }),
        updatedById: user.id
      },
      include: {
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

    return NextResponse.json({
      data: updatedPenyewa,
      message: 'Penyewa berhasil diubah'
    })
  } catch (error) {
    console.error('Update penyewa error:', error)

    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

async function handleDelete(request: NextRequest, { params }: ParamCtx) {
  try {
    const { id } = params

    const existingPenyewa = await prisma.penyewa.findUnique({
      where: { id }
    })

    if (!existingPenyewa) {
      return NextResponse.json({ message: 'Penyewa tidak ditemukan' }, { status: 404 })
    }

    await prisma.penyewa.delete({
      where: { id }
    })

    return NextResponse.json({
      message: 'Penyewa berhasil dihapus'
    })
  } catch (error) {
    console.error('Delete penyewa error:', error)

    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

export const GET = withAuth<{ id: string }>(handleGet)
export const PUT = withAuth<{ id: string }>(handlePut)
export const DELETE = withAuth<{ id: string }>(handleDelete)
