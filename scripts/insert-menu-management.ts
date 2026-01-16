import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  try {
    // Insert menu
    const menu = await prisma.menu.create({
      data: {
        nama: 'Management Sistem',
        path: '/management-master/menu',
        icon: 'tabler-menu-2',
        urutan: 6,
        status: true
      }
    })

    console.log('✅ Menu berhasil dibuat!')
    console.log('ID:', menu.id)
    console.log('Nama:', menu.nama)
    console.log('Path:', menu.path)
    console.log('Icon:', menu.icon)
    console.log('Urutan:', menu.urutan)
    console.log('Status:', menu.status ? 'Active' : 'Inactive')
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
