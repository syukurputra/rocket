import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import prisma from '@/src/libs/prisma'
import { withAuth, type AuthContext } from '@/src/libs/auth-middleware'
import { deleteFromS3, getS3KeyFromUrl } from '@/src/libs/s3'

// GET /api/master/paket/[id] - Get paket by ID
async function handleGet(request: NextRequest, { user, params }: AuthContext & { params: { id: string } }) {
  try {
    const paket = await prisma.masterPaket.findUnique({
      where: { id: params.id },
      include: {
        paketMenus: {
          select: {
            deskripsi: true,
            tampilkan: true,
            menu: {
              select: {
                id: true,
                nama: true,
                keterangan: true
              }
            }
          }
        }
      }
    })

    if (!paket) {
      return NextResponse.json({ message: 'Paket tidak ditemukan' }, { status: 404 })
    }

    return NextResponse.json({
      data: paket,
      message: 'Data paket berhasil diambil'
    })
  } catch (error) {
    console.error('Get paket error:', error)

    return NextResponse.json({ message: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

// PUT /api/master/paket/[id] - Update paket
async function handlePut(request: NextRequest, { user, params }: AuthContext & { params: { id: string } }) {
  try {
    const body = await request.json()
    const { nama, deskripsi, iconUrl, hargaBulanan, hargaTahunan, urutan, status } = body

    if (!nama) {
      return NextResponse.json({ message: 'Nama paket harus diisi' }, { status: 400 })
    }

    const existingPaket = await prisma.masterPaket.findUnique({
      where: { id: params.id }
    })

    if (!existingPaket) {
      return NextResponse.json({ message: 'Paket tidak ditemukan' }, { status: 404 })
    }

    // If icon is being removed (set to null) and there was an existing icon, delete it from S3
    if (iconUrl === null && existingPaket.iconUrl) {
      try {
        const s3Key = getS3KeyFromUrl(existingPaket.iconUrl)

        if (s3Key) {
          await deleteFromS3(s3Key)
        } else {
          // Fallback to local filesystem for old files
          const { unlink } = await import('fs/promises')
          const { join } = await import('path')
          const fullPath = join(process.cwd(), 'public', existingPaket.iconUrl)

          await unlink(fullPath)
        }
      } catch (err) {
        console.error('Failed to delete removed icon:', err)
      }
    }

    const paket = await prisma.masterPaket.update({
      where: { id: params.id },
      data: {
        nama,
        deskripsi: deskripsi || null,
        iconUrl: iconUrl !== undefined ? (iconUrl || null) : undefined,
        hargaBulanan,
        hargaTahunan,
        urutan: urutan !== undefined ? Number(urutan) : undefined,
        status: status !== undefined ? Boolean(status) : undefined
      }
    })

    return NextResponse.json({
      data: paket,
      message: 'Paket berhasil diperbarui'
    })
  } catch (error) {
    console.error('Update paket error:', error)

    return NextResponse.json({ message: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

// DELETE /api/master/paket/[id] - Delete paket
async function handleDelete(request: NextRequest, { user, params }: AuthContext & { params: { id: string } }) {
  try {
    const existingPaket = await prisma.masterPaket.findUnique({
      where: { id: params.id }
    })

    if (!existingPaket) {
      return NextResponse.json({ message: 'Paket tidak ditemukan' }, { status: 404 })
    }

    // Delete icon from S3 if exists
    if (existingPaket.iconUrl) {
      try {
        const s3Key = getS3KeyFromUrl(existingPaket.iconUrl)

        if (s3Key) {
          await deleteFromS3(s3Key)
        } else {
          // Fallback to local filesystem for old files
          const { unlink } = await import('fs/promises')
          const { join } = await import('path')
          const fullPath = join(process.cwd(), 'public', existingPaket.iconUrl)

          await unlink(fullPath)
        }
      } catch (err) {
        console.error('Failed to delete icon during paket deletion:', err)
      }
    }

    await prisma.masterPaket.delete({
      where: { id: params.id }
    })

    return NextResponse.json({
      message: 'Paket berhasil dihapus'
    })
  } catch (error) {
    console.error('Delete paket error:', error)

    return NextResponse.json({ message: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

export const GET = withAuth(handleGet)
export const PUT = withAuth(handlePut)
export const DELETE = withAuth(handleDelete)
