import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Creating menus and assigning to SUPER ADMIN role...\n')

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

  // Define menus to create
  const menusToCreate = [
    { nama: 'Home', path: '/home', icon: 'tabler-smart-home', urutan: 1 },
    { nama: 'Aset', path: '/aset/list', icon: 'tabler-home-dollar', urutan: 2 },
    { nama: 'Keuangan', path: '/keuangan/list', icon: 'tabler-chart-histogram', urutan: 3 },
    { nama: 'Penghuni', path: '/penghuni/list', icon: 'tabler-friends', urutan: 4 },
    { nama: 'Management Menu', path: '/management-master/menu', icon: 'tabler-menu-2', urutan: 5 }
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
  console.log(`📋 Total menus: ${createdMenus.length}`)
  console.log('🛡️  All menus assigned to SUPER ADMIN role with full CRUD permissions')
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
