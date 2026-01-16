import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  try {
    const paketId = 'cmk5gl33y00005kq0kby8dy7f'
    const menuId = 'cmk5j3dre00015kvkm9jruut2'

    // Verify paket exists
    const paket = await prisma.masterPaket.findUnique({
      where: { id: paketId }
    })

    if (!paket) {
      console.log('❌ Paket tidak ditemukan!')
      return
    }

    // Verify menu exists
    const menu = await prisma.menu.findUnique({
      where: { id: menuId }
    })

    if (!menu) {
      console.log('❌ Menu tidak ditemukan!')
      return
    }

    // Insert paket menu
    const paketMenu = await prisma.paketMenu.create({
      data: {
        paketId: paketId,
        menuId: menuId
      },
      include: {
        paket: true,
        menu: true
      }
    })

    console.log('✅ Menu berhasil di-assign ke paket!')
    console.log('ID:', paketMenu.id)
    console.log('Paket:', paketMenu.paket.nama)
    console.log('Menu:', paketMenu.menu.nama)
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
