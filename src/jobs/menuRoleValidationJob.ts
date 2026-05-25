import { PrismaClient } from '@prisma/client'

import type { ScheduledJob } from '../types/scheduler'

const prisma = new PrismaClient()

async function validateMenuRoleByPaket() {
  console.log('🔍 Memulai validasi menu_role berdasarkan paket...')

  try {
    // Ambil semua company beserta paket dan roles-nya
    const companies = await prisma.company.findMany({
      where: {
        id: { not: 'company-demo-001' }
      },
      select: {
        id: true,
        nama: true,
        paketId: true,
        paket: {
          select: {
            id: true,
            nama: true,
            paketMenus: {
              select: { menuId: true }
            }
          }
        },
        roles: {
          select: {
            id: true,
            nama: true,
            menuRoles: {
              select: { id: true, menuId: true }
            }
          }
        }
      }
    })

    let totalDeleted = 0

    for (const company of companies) {
      // Company tanpa paket aktif: skip
      if (!company.paket) {
        console.log(`⏭️  [${company.nama}] Tidak ada paket aktif, skip`)
        continue
      }

      const allowedMenuIds = new Set(company.paket.paketMenus.map(pm => pm.menuId))

      console.log(
        `🏢 [${company.nama}] Paket: ${company.paket.nama} | Menu diizinkan: ${allowedMenuIds.size}`
      )

      for (const role of company.roles) {
        // Kumpulkan menu_role yang menuId-nya tidak ada di paket
        const invalidMenuRoleIds = role.menuRoles
          .filter(mr => !allowedMenuIds.has(mr.menuId))
          .map(mr => mr.id)

        if (invalidMenuRoleIds.length === 0) continue

        await prisma.menuRole.deleteMany({
          where: { id: { in: invalidMenuRoleIds } }
        })

        totalDeleted += invalidMenuRoleIds.length
        console.log(
          `  🗑️  Role [${role.nama}]: hapus ${invalidMenuRoleIds.length} menu_role tidak sesuai paket`
        )
      }
    }

    console.log(`✅ Validasi selesai. Total menu_role dihapus: ${totalDeleted}`)
  } catch (error) {
    console.error('❌ Validasi menu_role gagal:', error)
    throw error
  }
}

async function insertMissingMenuRoleForSuperAdmin() {
  console.log('➕ Memulai insert menu_role untuk Super Admin (paket_menu tampilkan=false)...')

  try {
    const companies = await prisma.company.findMany({
      where: {
        id: { not: 'company-demo-001' },
        paketId: { not: null }
      },
      select: {
        id: true,
        nama: true,
        paket: {
          select: {
            id: true,
            nama: true,
            paketMenus: {
              where: { tampilkan: false },
              select: { menuId: true }
            }
          }
        },
        roles: {
          where: { nama: 'Super Admin' },
          select: {
            id: true,
            menuRoles: {
              select: { menuId: true }
            }
          }
        }
      }
    })

    let totalInserted = 0

    for (const company of companies) {
      if (!company.paket) continue

      const hiddenMenuIds = company.paket.paketMenus.map(pm => pm.menuId)
      if (hiddenMenuIds.length === 0) continue

      const superAdminRole = company.roles[0]
      if (!superAdminRole) {
        console.log(`⏭️  [${company.nama}] Tidak ada role Super Admin, skip`)
        continue
      }

      const existingMenuIds = new Set(superAdminRole.menuRoles.map(mr => mr.menuId))
      const toInsert = hiddenMenuIds.filter(menuId => !existingMenuIds.has(menuId))

      if (toInsert.length === 0) continue

      await prisma.menuRole.createMany({
        data: toInsert.map(menuId => ({
          roleId: superAdminRole.id,
          menuId
        })),
        skipDuplicates: true
      })

      totalInserted += toInsert.length
      console.log(
        `  ✅ [${company.nama}] Insert ${toInsert.length} menu_role untuk Super Admin (paket: ${company.paket.nama})`
      )
    }

    console.log(`✅ Insert selesai. Total menu_role ditambahkan: ${totalInserted}`)
  } catch (error) {
    console.error('❌ Insert menu_role Super Admin gagal:', error)
    throw error
  }
}

export const menuRoleValidationJob: ScheduledJob = {
  name: 'menu-role-validation',
  schedule: '0 * * * *', // Setiap 1 jam
  task: async () => {
    await validateMenuRoleByPaket()
    await insertMissingMenuRoleForSuperAdmin()
  },
  enabled: true,
  description: 'Validasi menu_role: hapus menu tidak sesuai paket & insert menu Super Admin yang belum ada'
}
