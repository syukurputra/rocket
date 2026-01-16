import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  try {
    const parentId = 'cmk5h8w1900005kb4s8cy0dq1'

    // Verify parent menu exists
    const parentMenu = await prisma.menu.findUnique({
      where: { id: parentId }
    })

    if (!parentMenu) {
      console.log('❌ Parent menu tidak ditemukan!')
      return
    }

    // Insert submenu
    const menu = await prisma.menu.create({
      data: {
        nama: 'Master Menu',
        path: '/management-master/menu',
        icon: 'tabler-menu-2',
        urutan: 7,
        parentId: parentId,
        status: true
      },
      include: {
        parent: true
      }
    })

    console.log('✅ Submenu berhasil dibuat!')
    console.log('ID:', menu.id)
    console.log('Nama:', menu.nama)
    console.log('Path:', menu.path)
    console.log('Icon:', menu.icon)
    console.log('Urutan:', menu.urutan)
    console.log('Parent:', menu.parent?.nama)
    console.log('Status:', menu.status ? 'Active' : 'Inactive')
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
