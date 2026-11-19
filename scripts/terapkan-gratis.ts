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
 *  2. Sinkronisasi menu_role: Super Admin setiap usaha mendapat semua menu
 *     tenant, menu non-tenant dicabut dari role usaha (logika yang sama
 *     dengan job `menu-role-sync`).
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
  const { sinkronMenuTenant } = await import('../src/jobs/menuRoleValidationJob')

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
    await sinkronMenuTenant({ simulasi: !jalankan })
  } finally {
    await prisma.$disconnect()
  }
}

main().catch(error => {
  console.error(error)
  process.exit(1)
})
