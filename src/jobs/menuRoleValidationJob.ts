import type { ScheduledJob } from '../types/scheduler'
import { getParameter } from '../libs/getParameter'
import prisma from '../libs/prisma'
import { ambilMenuTenantIds } from '../libs/menuTenant'

/**
 * Sinkronisasi menu_role setelah paket dihapus (Bantu Sewa 100% gratis).
 *
 * Untuk setiap usaha selain company admin platform:
 *  1. Role "Super Admin" dilengkapi SEMUA menu tenant. Usaha yang dulu berada
 *     di paket Free otomatis mendapat fitur yang sebelumnya berbayar, dan menu
 *     baru yang ditambahkan lewat Management > Menu ikut terbuka.
 *  2. Menu di luar daftar tenant (menu admin platform & sisa fitur paket)
 *     dicabut dari semua role usaha itu.
 *
 * Role lain buatan usaha sendiri tidak ditambahi menu — pengaturan aksesnya
 * tetap milik pemilik usaha lewat Setting > Role.
 */
export async function sinkronMenuTenant({ simulasi = false }: { simulasi?: boolean } = {}) {
  console.log(`🔄 Memulai sinkronisasi menu_role tenant${simulasi ? ' (SIMULASI — tidak mengubah data)' : ''}...`)

  const companySuper = await getParameter('COMPANY_SUPER')
  const menuTenant = await ambilMenuTenantIds()

  if (menuTenant.length === 0) {
    // Tanpa daftar menu, langkah pencabutan akan menghapus SEMUA akses.
    console.warn('⚠️ Daftar menu tenant kosong, sinkronisasi dibatalkan')

    return
  }

  const menuTenantSet = new Set(menuTenant)

  const companies = await prisma.company.findMany({
    where: companySuper ? { id: { not: companySuper } } : undefined,
    select: {
      id: true,
      nama: true,
      roles: {
        select: {
          id: true,
          nama: true,
          menuRoles: { select: { id: true, menuId: true } }
        }
      }
    }
  })

  let totalDitambah = 0
  let totalDicabut = 0

  for (const company of companies) {
    for (const role of company.roles) {
      const dicabut = role.menuRoles.filter(mr => !menuTenantSet.has(mr.menuId)).map(mr => mr.id)

      if (dicabut.length > 0) {
        if (!simulasi) await prisma.menuRole.deleteMany({ where: { id: { in: dicabut } } })
        totalDicabut += dicabut.length
        console.log(`  🗑️  [${company.nama}] Role ${role.nama}: cabut ${dicabut.length} menu non-tenant`)
      }

      if (role.nama !== 'Super Admin') continue

      const dimiliki = new Set(role.menuRoles.map(mr => mr.menuId))
      const kurang = menuTenant.filter(id => !dimiliki.has(id))

      if (kurang.length === 0) continue

      const jumlah = simulasi
        ? kurang.length
        : (
            await prisma.menuRole.createMany({
              data: kurang.map(menuId => ({ roleId: role.id, menuId })),
              skipDuplicates: true
            })
          ).count

      totalDitambah += jumlah
      console.log(`  ✅ [${company.nama}] Super Admin: tambah ${jumlah} menu`)
    }
  }

  console.log(`✅ Sinkronisasi selesai. Ditambah: ${totalDitambah}, dicabut: ${totalDicabut}`)
}

export const menuRoleValidationJob: ScheduledJob = {
  name: 'menu-role-sync',
  schedule: '0 * * * *', // Setiap 1 jam
  task: () => sinkronMenuTenant(),
  enabled: true,
  description: 'Lengkapi menu Super Admin tiap usaha & cabut menu non-tenant (tanpa paket)'
}
