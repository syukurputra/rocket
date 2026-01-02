import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Creating hierarchical menu structure...\n')

  // Find Management Menu (parent)
  const parentMenu = await prisma.menu.findFirst({
    where: {
      nama: 'Management Menu',
      companyId: null
    }
  })

  if (!parentMenu) {
    console.error('❌ Management Menu not found!')

    return
  }

  console.log('✅ Found parent menu:', parentMenu.nama, `(ID: ${parentMenu.id})`)

  // Find all child menus
  const childMenuNames = ['Kategori Keuangan', 'Master Menu', 'Master Role', 'Master User', 'Master Company']

  let updatedCount = 0

  for (const menuName of childMenuNames) {
    const menu = await prisma.menu.findFirst({
      where: {
        nama: menuName,
        companyId: null
      }
    })

    if (menu) {
      // Update parentId
      await prisma.menu.update({
        where: { id: menu.id },
        data: { parentId: parentMenu.id }
      })

      console.log(`✅ Set "${menuName}" as child of "Management Menu"`)
      updatedCount++
    } else {
      console.log(`⚠️  Menu "${menuName}" not found`)
    }
  }

  console.log(`\n🎉 Hierarchical structure created!`)
  console.log(`📋 Parent: Management Menu`)
  console.log(`👶 Children: ${updatedCount} menus`)

  // Verify structure
  const children = await prisma.menu.findMany({
    where: {
      parentId: parentMenu.id
    },
    orderBy: {
      urutan: 'asc'
    }
  })

  console.log('\n📊 Menu Structure:')
  console.log(`└─ ${parentMenu.nama}`)
  children.forEach(child => {
    console.log(`   ├─ ${child.nama} (${child.path})`)
  })
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async e => {
    console.error('❌ Error:', e)
    await prisma.$disconnect()
    process.exit(1)
  })
