import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import prisma from '@/src/libs/prisma'
import { withAuth, type AuthContext } from '@/src/libs/auth-middleware'
import { deleteFromS3, getS3KeyFromUrl } from '@/src/libs/s3'

type ParamCtx = AuthContext & { params: { id: string } }

async function handleGet(request: NextRequest, { params }: ParamCtx) {
  try {
    const { id } = params

    const aset = await prisma.aset.findUnique({
      where: { id },
      include: {
        images: true,
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

    if (!aset) {
      return NextResponse.json({ message: 'Aset tidak ditemukan' }, { status: 404 })
    }

    // Ambil publishId & syaratKetentuan via raw SQL
    const extraRows = await prisma.$queryRaw<{ publishId: string | null; syaratKetentuan: string | null }[]>`
      SELECT "publishId", "syaratKetentuan" FROM aset WHERE id = ${id}
    `
    const publishId = extraRows[0]?.publishId ?? null
    const syaratKetentuan = extraRows[0]?.syaratKetentuan ?? null

    return NextResponse.json({
      data: { ...aset, publishId, syaratKetentuan },
      message: 'Data berhasil diambil'
    })
  } catch (error) {
    console.error('Get aset by ID error:', error)

    return NextResponse.json({ message: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

async function handlePut(request: NextRequest, { user, params }: ParamCtx) {
  try {
    const { id } = await params
    const body = await request.json()
    const { jenis, nama, deskripsi, nomorWa, nomorWaAktif, instagram, instagramAktif, facebook, facebookAktif, alamat, kota, provinsi, kecamatan, kelurahan, latitude, longitude, status, publishId, syaratKetentuan, bookingOnline, pembayaranOnline } = body

    const existingAset = await prisma.aset.findUnique({
      where: { id }
    })

    if (!existingAset) {
      return NextResponse.json({ message: 'Aset tidak ditemukan' }, { status: 404 })
    }

    // Validasi dan simpan publishId via raw SQL (bypass Prisma Client type check)
    if (publishId !== undefined && publishId !== null && publishId !== '') {
      const slugPattern = /^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$/
      if (!slugPattern.test(publishId)) {
        return NextResponse.json({ message: 'ID Publish hanya boleh huruf kecil, angka, dan tanda hubung (-), tidak boleh diawali/diakhiri tanda hubung' }, { status: 400 })
      }
      const conflicts = await prisma.$queryRaw<{ id: string }[]>`SELECT id FROM aset WHERE "publishId" = ${publishId} AND id != ${id}`
      if (conflicts.length > 0) {
        return NextResponse.json({ message: 'ID Publish sudah digunakan oleh aset lain' }, { status: 409 })
      }
    }

    const updatedAset = await prisma.aset.update({
      where: { id },
      data: {
        jenis,
        nama,
        deskripsi,
        nomorWa: nomorWa !== undefined ? (nomorWa || null) : undefined,
        nomorWaAktif: nomorWaAktif !== undefined ? nomorWaAktif === true : undefined,
        instagram: instagram !== undefined ? (instagram || null) : undefined,
        instagramAktif: instagramAktif !== undefined ? instagramAktif === true : undefined,
        facebook: facebook !== undefined ? (facebook || null) : undefined,
        facebookAktif: facebookAktif !== undefined ? facebookAktif === true : undefined,
        alamat,
        kota,
        provinsi,
        kecamatan,
        kelurahan,
        latitude: latitude !== undefined ? Number(latitude) : undefined,
        longitude: longitude !== undefined ? Number(longitude) : undefined,
        updatedById: user.id,
        ...(status && { status }),
        ...(bookingOnline !== undefined && { bookingOnline: bookingOnline === true }),
        ...(pembayaranOnline !== undefined && { pembayaranOnline: pembayaranOnline === true })
      },
      include: {
        images: true,
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

    // Update publishId & syaratKetentuan via raw SQL
    if (publishId !== undefined) {
      const slug = publishId || null
      await prisma.$executeRaw`UPDATE aset SET "publishId" = ${slug} WHERE id = ${id}`
    }

    if (syaratKetentuan !== undefined) {
      const syarat = syaratKetentuan || null
      await prisma.$executeRaw`UPDATE aset SET "syaratKetentuan" = ${syarat} WHERE id = ${id}`
    }

    return NextResponse.json({
      data: updatedAset,
      message: 'Aset berhasil diupdate'
    })
  } catch (error) {
    console.error('Update aset error:', error)

    return NextResponse.json({ message: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

async function handleDelete(request: NextRequest, { user, params }: ParamCtx) {
  try {
    const { id } = await params

    const existingAset = await prisma.aset.findUnique({
      where: { id },
      include: {
        images: true,
        ruangan: {
          include: {
            images: true
          }
        }
      }
    })

    if (!existingAset) {
      return NextResponse.json({ message: 'Aset tidak ditemukan' }, { status: 404 })
    }

    // Check ownership
    if (existingAset.companyId !== user.companyId) {
      return NextResponse.json({ message: 'Akses tidak diizinkan' }, { status: 403 })
    }

    // Delete all aset images from S3
    for (const image of existingAset.images) {
      try {
        const s3Key = getS3KeyFromUrl(image.filepath)

        if (s3Key) {
          await deleteFromS3(s3Key)
        }
      } catch (err) {
        console.error(`Failed to delete aset image from S3: ${image.filepath}`, err)
      }
    }

    // Delete all item aset (ruangan) images from S3
    for (const ruangan of existingAset.ruangan) {
      for (const image of ruangan.images) {
        try {
          const s3Key = getS3KeyFromUrl(image.filepath)

          if (s3Key) {
            await deleteFromS3(s3Key)
          }
        } catch (err) {
          console.error(`Failed to delete item aset image from S3: ${image.filepath}`, err)
        }
      }
    }

    // Delete aset from DB (cascade will remove images, ruangan, etc. from DB)
    await prisma.aset.delete({
      where: { id }
    })

    return NextResponse.json({
      message: 'Aset berhasil dihapus'
    })
  } catch (error) {
    console.error('Delete aset error:', error)

    return NextResponse.json({ message: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

export const GET = withAuth<{ id: string }>(handleGet)
export const PUT = withAuth<{ id: string }>(handlePut)
export const DELETE = withAuth<{ id: string }>(handleDelete)
