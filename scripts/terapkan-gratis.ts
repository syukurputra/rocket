/**
 * Script sekali jalan: menerapkan "Bantu Sewa 100% gratis" ke database.
 *
 * JALANKAN SETELAH kode baru (tanpa paket) sudah di-deploy ke server tujuan.
 * Kalau dijalankan lebih dulu, job lama di server (validasi menu per paket,
 * tiap jam) akan menghapus lagi menu yang baru diberikan.
 *
 * Langkah:
 *  1. Menonaktifkan menu sisa paket: Paket (/paket/pricing), Master Paket,
 *     dan Invoice paket (/setting/invoice) — halamannya sudah dihapus.
 *  2. Sinkronisasi menu_role untuk setiap usaha selain admin platform:
 *     - Role "Super Admin" dilengkapi SEMUA menu tenant, sehingga usaha yang
 *       dulu di paket Free langsung mendapat fitur yang sebelumnya berbayar.
 *     - Menu di luar daftar tenant (menu admin platform & sisa paket) dicabut
 *       dari semua role usaha itu.
 *     Role lain buatan usaha sendiri tidak ditambahi menu.
 *
 * Cukup dijalankan sekali. Setelah itu tidak ada scheduler: usaha baru
 * langsung mendapat semua menu saat mendaftar (`beriSemuaMenuTenant`).
 *
 * Pemakaian (dari folder rocket):
 *   npx tsx scripts/terapkan-gratis.ts --env=.env.production            # simulasi, tidak mengubah data
 *   npx tsx scripts/terapkan-gratis.ts --env=.env.production --jalankan # benar-benar dijalankan
 */
import { config } from 'dotenv'

const MENU_DINONAKTIFKAN = ['menu-paket-pilihan', 'menu-paket', 'menu-setting-invoice']

async function main() {
  const argEnv = process.argv.find(a => a.startsWith('--env='))
  const berkasEnv = argEnv ? argEnv.slice('--env='.length) : '.env'
  const jalankan = process.argv.includes('--jalankan')

  // override: nilai dari berkas yang dipilih menang atas .env bawaan.
  config({ path: berkasEnv, override: true })

  const url = process.env.DATABASE_URL || ''
  const host = url.replace(/^.*@/, '').replace(/\?.*$/, '')

  console.log(`Database : ${host || '(DATABASE_URL kosong)'}  [dari ${berkasEnv}]`)
  console.log(`Mode     : ${jalankan ? 'JALANKAN — data akan diubah' : 'SIMULASI — tidak ada data yang diubah'}`)
  console.log('')

  if (!url) throw new Error('DATABASE_URL tidak ditemukan')

  // Diimpor setelah env dimuat supaya Prisma terhubung ke database yang benar.
  const { default: prisma } = await import('../src/libs/prisma')
  const { getParameter } = await import('../src/libs/getParameter')
  const { ambilMenuTenantIds } = await import('../src/libs/menuTenant')

  try {
    // --- Langkah 1 ---
    const menus = await prisma.menu.findMany({
      where: { id: { in: MENU_DINONAKTIFKAN } },
      select: { id: true, nama: true, path: true, status: true }
    })

    console.log('Langkah 1 — nonaktifkan menu sisa paket:')

    for (const m of menus) {
      console.log(`  - ${m.id} (${m.nama}, ${m.path}) status sekarang: ${m.status ? 'aktif' : 'nonaktif'}`)
    }

    if (jalankan) {
      const hasil = await prisma.menu.updateMany({
        where: { id: { in: MENU_DINONAKTIFKAN }, status: true },
        data: { status: false }
      })

      console.log(`  → ${hasil.count} menu dinonaktifkan`)
    }

    console.log('')

    // --- Langkah 2 ---
    console.log('Langkah 2 — sinkronisasi menu_role:')

    const simulasi = !jalankan
    const companySuper = await getParameter('COMPANY_SUPER')

    // Pada simulasi, menu langkah 1 belum dinonaktifkan; ketiganya memang
    // sudah dikecualikan dari daftar tenant, jadi hasilnya tetap sama.
    const menuTenant = await ambilMenuTenantIds()

    if (menuTenant.length === 0) {
      // Tanpa daftar menu, langkah pencabutan akan menghapus SEMUA akses.
      throw new Error('Daftar menu tenant kosong — sinkronisasi dibatalkan')
    }

    const menuTenantSet = new Set(menuTenant)

    const companies = await prisma.company.findMany({
      where: companySuper ? { id: { not: companySuper } } : undefined,
      select: {
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
          console.log(`  - [${company.nama}] ${role.nama}: cabut ${dicabut.length} menu non-tenant`)
        }

        if (role.nama !== 'Super Admin') continue

        const dimiliki = new Set(role.menuRoles.map(mr => mr.menuId))
        const kurang = menuTenant.filter(id => !dimiliki.has(id))

        if (kurang.length === 0) continue

        if (!simulasi) {
          await prisma.menuRole.createMany({
            data: kurang.map(menuId => ({ roleId: role.id, menuId })),
            skipDuplicates: true
          })
        }

        totalDitambah += kurang.length
        console.log(`  + [${company.nama}] Super Admin: tambah ${kurang.length} menu`)
      }
    }

    console.log(`  → ${companies.length} usaha diperiksa. Ditambah: ${totalDitambah}, dicabut: ${totalDicabut}`)
  } finally {
    await prisma.$disconnect()
  }
}

main().catch(error => {
  console.error(error)
  process.exit(1)
})
