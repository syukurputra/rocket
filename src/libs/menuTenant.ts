import prisma from '@/src/libs/prisma'
import { getParameter } from '@/src/libs/getParameter'

/**
 * Menu yang berhak dipakai setiap usaha (tenant).
 *
 * Bantu Sewa kini 100% gratis: tidak ada lagi paket berlangganan, dan semua
 * usaha mendapat fitur yang sama. Sebelumnya daftar menu tiap usaha diambil
 * dari `paket_menu` milik paketnya; sekarang satu daftar ini berlaku untuk
 * semua. Menu baru yang ditambahkan lewat Management > Menu langsung masuk
 * daftar ini — usaha baru mendapatkannya saat mendaftar, dan pemilik usaha
 * lama bisa mencentangnya di Setting > Role.
 *
 * Yang dikecualikan hanya menu milik admin platform dan sisa fitur paket.
 */

/** Induk menu admin platform; menu ini dan seluruh anaknya bukan untuk tenant. */
export const MENU_INDUK_PLATFORM = 'menu-management'

/** Menu sisa sistem paket yang tidak lagi relevan bagi tenant. */
export const MENU_PAKET_LAMA = [
  'menu-paket-pilihan', // /paket/pricing — halaman beli/upgrade paket
  'menu-setting-invoice' // /setting/invoice — invoice pembelian paket
]

const MENU_DIKECUALIKAN = [MENU_INDUK_PLATFORM, ...MENU_PAKET_LAMA]

/** ID semua menu tenant yang aktif. */
export async function ambilMenuTenantIds(): Promise<string[]> {
  const menus = await prisma.menu.findMany({
    where: {
      status: true,
      id: { notIn: MENU_DIKECUALIKAN },

      // `parentId <> x` di SQL ikut membuang baris yang parentId-nya NULL,
      // jadi menu tingkat atas harus diloloskan secara eksplisit.
      OR: [{ parentId: null }, { parentId: { not: MENU_INDUK_PLATFORM } }]
    },
    select: { id: true }
  })

  return menus.map(m => m.id)
}

/** Company admin platform (parameter `COMPANY_SUPER`) boleh memakai semua menu. */
export async function companyPlatform(companyId: string | null | undefined): Promise<boolean> {
  if (!companyId) return false

  return companyId === (await getParameter('COMPANY_SUPER'))
}

/**
 * ID menu yang boleh diberikan ke role milik [companyId]: semua menu aktif
 * untuk admin platform, menu tenant untuk usaha lainnya.
 */
export async function ambilMenuIdsUntukCompany(companyId: string | null | undefined): Promise<string[]> {
  if (await companyPlatform(companyId)) {
    const semua = await prisma.menu.findMany({ where: { status: true }, select: { id: true } })

    return semua.map(m => m.id)
  }

  return ambilMenuTenantIds()
}

/** Data menu untuk [companyId] (lihat `ambilMenuIdsUntukCompany`), urut seperti di sidebar. */
export async function ambilMenuUntukCompany(companyId: string | null | undefined) {
  const ids = await ambilMenuIdsUntukCompany(companyId)

  return prisma.menu.findMany({
    where: { id: { in: ids } },
    select: {
      id: true,
      nama: true,
      path: true,
      icon: true,
      urutan: true,
      parentId: true,
      status: true,
      keterangan: true
    },
    orderBy: { urutan: 'asc' }
  })
}

/**
 * Memberi semua menu tenant ke sebuah role (biasanya Super Admin usaha baru).
 * Aman dipanggil berulang — menu yang sudah dimiliki dilewati.
 */
export async function beriSemuaMenuTenant(roleId: string): Promise<number> {
  const ids = await ambilMenuTenantIds()

  if (ids.length === 0) return 0

  const hasil = await prisma.menuRole.createMany({
    data: ids.map(menuId => ({ roleId, menuId })),
    skipDuplicates: true
  })

  return hasil.count
}
