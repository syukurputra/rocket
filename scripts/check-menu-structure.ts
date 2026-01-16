import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  try {
    console.log('🔍 Checking menu structure...\n')

    // Find all parent menus
    const parentMenus = await prisma.menu.findMany({
      where: { parentId: null },
      include: {
        children: true
      },
      orderBy: { urutan: 'asc' }
    })

    console.log('📋 Parent Menus:')
    parentMenus.forEach(menu => {
      console.log(`\n  ├─ ${menu.nama} (ID: ${menu.id})`)
      console.log(`     Path: ${menu.path || 'N/A'}`)
      console.log(`     Icon: ${menu.icon || 'N/A'}`)
      console.log(`     Status: ${menu.status ? 'Active' : 'Inactive'}`)
      
      if (menu.children.length > 0) {
        console.log(`     Children:`)
        menu.children.forEach(child => {
          console.log(`       └─ ${child.nama} (${child.path})`)
        })
      }
    })

    // Check if "Management Sistem" exists
    const managementSistem = parentMenus.find(m => 
      m.nama.toLowerCase().includes('management') || 
      m.nama.toLowerCase().includes('sistem')
    )

    console.log('\n\n🔍 Looking for "Management Sistem" menu...')
    if (managementSistem) {
      console.log(`✅ Found: ${managementSistem.nama} (ID: ${managementSistem.id})`)
      
      // Check if Master Paket submenu exists
      const paketSubmenu = managementSistem.children.find(c => 
        c.nama.toLowerCase().includes('paket')
      )
      
      if (paketSubmenu) {
        console.log(`✅ Master Paket submenu already exists: ${paketSubmenu.nama}`)
      } else {
        console.log(`❌ Master Paket submenu NOT found under ${managementSistem.nama}`)
      }
    } else {
      console.log('❌ "Management Sistem" parent menu NOT found')
    }

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
