// Menambahkan menu Support (user) + submenu Tiket & Category Tiket di Management
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const SUPPORT_ID = 'menu-support'
const TIKET_ID = 'menu-management-tiket'
const KATEGORI_TIKET_ID = 'menu-management-kategori-tiket'

async function assignToRolesAndPackages(menuId: string) {
  const roles = await prisma.role.findMany()

  for (const role of roles) {
    await prisma.menuRole.upsert({
      where: { roleId_menuId: { roleId: role.id, menuId } },
      update: {},
      create: { roleId: role.id, menuId }
    })
  }

  const packages = await prisma.masterPaket.findMany()

  for (const pkg of packages) {
    await prisma.paketMenu.upsert({
      where: { paketId_menuId: { paketId: pkg.id, menuId } },
      update: {},
      create: { paketId: pkg.id, menuId }
    })
  }

  console.log(`  ✓ ${menuId} → ${roles.length} role & ${packages.length} paket`)
}

async function main() {
  console.log('🔧 Menambahkan menu Support & Tiket...\n')

  // Cari menu Management (parent submenu CS)
  const management = await prisma.menu.findFirst({
    where: { parentId: null, nama: { contains: 'Management', mode: 'insensitive' } },
    orderBy: { urutan: 'asc' }
  })

  if (!management) {
    console.error('❌ Menu parent "Management" tidak ditemukan')
    process.exit(1)
  }

  console.log(`Parent Management: ${management.nama} (${management.id})`)

  // Urutan submenu berikutnya di Management
  const lastChild = await prisma.menu.findFirst({
    where: { parentId: management.id },
    orderBy: { urutan: 'desc' }
  })

  const nextUrutan = (lastChild?.urutan ?? 0) + 1

  // Menu Support (sisi user) — taruh setelah menu Chat bila ada
  const chat = await prisma.menu.findFirst({ where: { parentId: null, nama: { equals: 'Chat', mode: 'insensitive' } } })
  const supportUrutan = (chat?.urutan ?? 90) + 1

  if (chat) {
    await prisma.menu.updateMany({
      where: { parentId: null, urutan: { gte: supportUrutan }, id: { not: SUPPORT_ID } },
      data: { urutan: { increment: 1 } }
    })
  }

  await prisma.menu.upsert({
    where: { id: SUPPORT_ID },
    update: { nama: 'Support', path: '/support', icon: 'tabler-lifebuoy', urutan: supportUrutan, parentId: null, status: true },
    create: {
      id: SUPPORT_ID,
      nama: 'Support',
      path: '/support',
      icon: 'tabler-lifebuoy',
      urutan: supportUrutan,
      parentId: null,
      status: true
    }
  })
  console.log('✓ Menu "Support" dibuat')

  // Submenu Management: Tiket
  await prisma.menu.upsert({
    where: { id: TIKET_ID },
    update: { nama: 'Tiket', path: '/management-master/tiket', icon: 'tabler-ticket', urutan: nextUrutan, parentId: management.id, status: true },
    create: {
      id: TIKET_ID,
      nama: 'Tiket',
      path: '/management-master/tiket',
      icon: 'tabler-ticket',
      urutan: nextUrutan,
      parentId: management.id,
      status: true
    }
  })
  console.log('✓ Submenu "Tiket" dibuat')

  // Submenu Management: Category Tiket
  await prisma.menu.upsert({
    where: { id: KATEGORI_TIKET_ID },
    update: { nama: 'Category Tiket', path: '/management-master/kategori-tiket', icon: 'tabler-category', urutan: nextUrutan + 1, parentId: management.id, status: true },
    create: {
      id: KATEGORI_TIKET_ID,
      nama: 'Category Tiket',
      path: '/management-master/kategori-tiket',
      icon: 'tabler-category',
      urutan: nextUrutan + 1,
      parentId: management.id,
      status: true
    }
  })
  console.log('✓ Submenu "Category Tiket" dibuat\n')

  console.log('🔗 Assign ke role & paket...')
  await assignToRolesAndPackages(SUPPORT_ID)
  await assignToRolesAndPackages(TIKET_ID)
  await assignToRolesAndPackages(KATEGORI_TIKET_ID)

  console.log('\n✅ Selesai!')
}

main()
  .then(async () => {
    await prisma.$disconnect()
    process.exit(0)
  })
  .catch(async e => {
    console.error('❌ Gagal:', e)
    await prisma.$disconnect()
    process.exit(1)
  })
