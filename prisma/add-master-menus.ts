import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Adding additional menus and assigning to SUPER ADMIN role...\n')

  // Find SUPER ADMIN role
  const superAdminRole = await prisma.role.findFirst({
    where: {
      nama: 'SUPER ADMIN',
      companyId: null
    }
  })

  if (!superAdminRole) {
    console.error('❌ SUPER ADMIN role not found! Please run seed.ts first.')

    return
  }

  console.log('✅ Found SUPER ADMIN role:', superAdminRole.nama)

  // Define new menus to create
  const menusToCreate = [
    { nama: 'Kategori Keuangan', path: '/master/icon/list', icon: 'tabler-favicon', urutan: 6 },
    { nama: 'Master Menu', path: '/management-master/menu', icon: 'tabler-menu-2', urutan: 7 },
    { nama: 'Master Role', path: '/management-master/role', icon: 'tabler-shield', urutan: 8 },
    { nama: 'Master User', path: '/management-master/user', icon: 'tabler-users', urutan: 9 },
    { nama: 'Master Company', path: '/management-master/company', icon: 'tabler-building', urutan: 10 }
  ]

  const createdMenus = []

  for (const menuData of menusToCreate) {
    // Check if menu already exists
    let menu = await prisma.menu.findFirst({
      where: {
        nama: menuData.nama,
        companyId: null // Global menu
      }
    })

    if (!menu) {
      menu = await prisma.menu.create({
        data: {
          ...menuData,
          status: true,
          companyId: null // Global menu
        }
      })

      console.log(`✅ Created menu: ${menu.nama}`)
    } else {
      console.log(`ℹ️  Menu already exists: ${menu.nama}`)
    }

    createdMenus.push(menu)
  }

  // Assign all menus to SUPER ADMIN role with full permissions
  for (const menu of createdMenus) {
    const existingRoleMenu = await prisma.roleMenu.findUnique({
      where: {
        roleId_menuId: {
          roleId: superAdminRole.id,
          menuId: menu.id
        }
      }
    })

    if (!existingRoleMenu) {
      await prisma.roleMenu.create({
        data: {
          roleId: superAdminRole.id,
          menuId: menu.id,
          canCreate: true,
          canRead: true,
          canUpdate: true,
          canDelete: true
        }
      })

      console.log(`✅ Assigned menu "${menu.nama}" to SUPER ADMIN with full permissions`)
    } else {
      console.log(`ℹ️  Menu "${menu.nama}" already assigned to SUPER ADMIN`)
    }
  }

  console.log('\n🎉 Setup complete!')
  console.log(`📋 New menus added: ${createdMenus.length}`)
  console.log('🛡️  All menus assigned to SUPER ADMIN role with full CRUD permissions')
  console.log('\n📝 Total menus for SUPER ADMIN:')

  const totalMenus = await prisma.roleMenu.count({
    where: {
      roleId: superAdminRole.id
    }
  })

  console.log(`   ${totalMenus} menus with full permissions`)
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
