import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  try {
    console.log('🚀 Adding Master Paket submenu to Management Sistem...\n')

    // Management Sistem parent menu ID
    const managementSistemId = 'cmk5h8w1900005kb4s8cy0dq1'

    // Check if Management Sistem exists
    const managementSistem = await prisma.menu.findUnique({
      where: { id: managementSistemId },
      include: { children: true }
    })

    if (!managementSistem) {
      console.log('❌ Management Sistem menu not found!')
      return
    }

    console.log(`✅ Found parent menu: ${managementSistem.nama}`)
    console.log(`   Current children: ${managementSistem.children.length}`)

    // Check if Master Paket already exists
    const existingPaket = managementSistem.children.find(c => c.nama.toLowerCase().includes('paket'))

    if (existingPaket) {
      console.log(`\n⚠️  Master Paket already exists: ${existingPaket.nama}`)
      console.log(`   ID: ${existingPaket.id}`)
      console.log(`   Path: ${existingPaket.path}`)
      return
    }

    // Get the highest urutan value among children
    const maxUrutan = managementSistem.children.reduce((max, child) => Math.max(max, child.urutan), 0)

    // Create Master Paket submenu
    const masterPaket = await prisma.menu.create({
      data: {
        nama: 'Master Paket',
        path: '/management-master/paket',
        icon: 'tabler-package',
        urutan: maxUrutan + 1,
        parentId: managementSistemId,
        status: true
      }
    })

    console.log('\n✅ Master Paket submenu created successfully!')
    console.log(`   ID: ${masterPaket.id}`)
    console.log(`   Name: ${masterPaket.nama}`)
    console.log(`   Path: ${masterPaket.path}`)
    console.log(`   Icon: ${masterPaket.icon}`)
    console.log(`   Order: ${masterPaket.urutan}`)
    console.log(`   Parent: ${managementSistem.nama}`)
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
