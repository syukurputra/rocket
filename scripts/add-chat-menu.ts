// Script: menambahkan menu "Chat" (parent) beserta submenu "Chat Saya" & "Chat Usaha"
// Ditempatkan tepat setelah menu "Booking", lalu di-assign ke semua role & paket.
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const CHAT_PARENT_ID = 'menu-chat'
const CHAT_SAYA_ID = 'menu-chat-saya'
const CHAT_USAHA_ID = 'menu-chat-usaha'

async function assignMenuToRolesAndPackages(menuId: string) {
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

  console.log(`  ✓ Menu ${menuId} di-assign ke ${roles.length} role & ${packages.length} paket`)
}

async function main() {
  console.log('🔧 Menambahkan menu Chat...\n')

  // 1. Cari menu Booking (root) untuk menentukan urutan
  const booking = await prisma.menu.findFirst({
    where: { parentId: null, nama: { equals: 'Booking', mode: 'insensitive' } }
  })

  const bookingUrutan = booking?.urutan ?? 90
  const chatUrutan = bookingUrutan + 1

  // 2. Geser urutan menu root lain yang berada setelah Booking agar Chat bisa disisipkan
  if (booking) {
    await prisma.menu.updateMany({
      where: { parentId: null, urutan: { gte: chatUrutan }, id: { not: CHAT_PARENT_ID } },
      data: { urutan: { increment: 1 } }
    })
  }

  // 3. Buat menu parent Chat
  await prisma.menu.upsert({
    where: { id: CHAT_PARENT_ID },
    update: { nama: 'Chat', icon: 'tabler-message-circle', urutan: chatUrutan, parentId: null, status: true },
    create: {
      id: CHAT_PARENT_ID,
      nama: 'Chat',
      path: null,
      icon: 'tabler-message-circle',
      urutan: chatUrutan,
      parentId: null,
      status: true
    }
  })
  console.log('✓ Menu parent "Chat" dibuat')

  // 4. Submenu Chat Saya
  await prisma.menu.upsert({
    where: { id: CHAT_SAYA_ID },
    update: { nama: 'Chat Saya', path: '/chat/saya', icon: 'tabler-message', urutan: 1, parentId: CHAT_PARENT_ID, status: true },
    create: {
      id: CHAT_SAYA_ID,
      nama: 'Chat Saya',
      path: '/chat/saya',
      icon: 'tabler-message',
      urutan: 1,
      parentId: CHAT_PARENT_ID,
      status: true
    }
  })
  console.log('✓ Submenu "Chat Saya" dibuat')

  // 5. Submenu Chat Usaha
  await prisma.menu.upsert({
    where: { id: CHAT_USAHA_ID },
    update: { nama: 'Chat Usaha', path: '/chat/usaha', icon: 'tabler-building-store', urutan: 2, parentId: CHAT_PARENT_ID, status: true },
    create: {
      id: CHAT_USAHA_ID,
      nama: 'Chat Usaha',
      path: '/chat/usaha',
      icon: 'tabler-building-store',
      urutan: 2,
      parentId: CHAT_PARENT_ID,
      status: true
    }
  })
  console.log('✓ Submenu "Chat Usaha" dibuat\n')

  // 6. Assign ketiga menu ke semua role & paket
  console.log('🔗 Meng-assign menu ke role & paket...')
  await assignMenuToRolesAndPackages(CHAT_PARENT_ID)
  await assignMenuToRolesAndPackages(CHAT_SAYA_ID)
  await assignMenuToRolesAndPackages(CHAT_USAHA_ID)

  console.log('\n✅ Menu Chat berhasil ditambahkan!')
}

main()
  .then(async () => {
    await prisma.$disconnect()
    process.exit(0)
  })
  .catch(async error => {
    console.error('❌ Gagal:', error)
    await prisma.$disconnect()
    process.exit(1)
  })
