import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import prisma from '@/src/libs/prisma'
import { withAuth, type AuthContext } from '@/src/libs/auth-middleware'

// POST /api/paket/trial - Aktivasi trial paket untuk company
async function handlePost(request: NextRequest, { user }: AuthContext) {
  try {
    if (!user.companyId) {
      return NextResponse.json({ message: 'Tidak terhubung dengan perusahaan' }, { status: 400 })
    }

    const { paketId } = await request.json()

    if (!paketId) {
      return NextResponse.json({ message: 'paketId harus diisi' }, { status: 400 })
    }

    const company = await prisma.company.findUnique({
      where: { id: user.companyId },
      select: { isTrial: true }
    })

    if (!company) {
      return NextResponse.json({ message: 'Company tidak ditemukan' }, { status: 404 })
    }

    if (company.isTrial) {
      return NextResponse.json({ message: 'Trial sudah pernah digunakan' }, { status: 400 })
    }

    const paket = await prisma.masterPaket.findUnique({
      where: { id: paketId, status: true }
    })

    if (!paket) {
      return NextResponse.json({ message: 'Paket tidak ditemukan' }, { status: 404 })
    }

    const now = new Date()
    const paketEndDate = new Date(now)
    paketEndDate.setMonth(paketEndDate.getMonth() + 1)

    await prisma.company.update({
      where: { id: user.companyId },
      data: {
        paketId,
        isTrial: true,
        paketStartDate: now,
        paketEndDate
      }
    })

    // Beri akses menu sesuai paket baru ke Super Admin role
    const paketMenus = await prisma.paketMenu.findMany({
      where: { paketId },
      select: { menuId: true }
    })

    const superAdminRole = await prisma.role.findFirst({
      where: { companyId: user.companyId, nama: { equals: 'Super Admin', mode: 'insensitive' } },
      select: { id: true, menuRoles: { select: { menuId: true } } }
    })

    if (superAdminRole && paketMenus.length > 0) {
      const existingMenuIds = new Set(superAdminRole.menuRoles.map(mr => mr.menuId))
      const toInsert = paketMenus.map(pm => pm.menuId).filter(id => !existingMenuIds.has(id))

      if (toInsert.length > 0) {
        await prisma.menuRole.createMany({
          data: toInsert.map(menuId => ({ roleId: superAdminRole.id, menuId })),
          skipDuplicates: true
        })
      }
    }

    // Buat notifikasi trial aktif
    prisma.notifikasi.create({
      data: {
        title: 'Trial Paket Aktif',
        subtitle: `${paket.nama} — trial 1 bulan hingga ${paketEndDate.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}`,
        avatarIcon: 'tabler-rocket',
        avatarColor: 'success',
        type: 'system',
        userId: user.id
      }
    }).catch(() => {})

    return NextResponse.json({
      message: `Trial paket ${paket.nama} berhasil diaktifkan`,
      trialExpiredAt: paketEndDate.toISOString()
    })
  } catch (error) {
    console.error('Activate trial error:', error)

    return NextResponse.json({ message: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

export const POST = withAuth(handlePost)
