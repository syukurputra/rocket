const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  // Upsert menu Parameterisasi
  const menu = await prisma.menu.upsert({
    where: { id: 'menu-parameterisasi' },
    update: {
      nama: 'Parameterisasi',
      path: '/management-master/parameterisasi',
      icon: 'tabler-adjustments-horizontal',
      urutan: 8,
      parentId: 'menu-management',
      status: true
    },
    create: {
      id: 'menu-parameterisasi',
      nama: 'Parameterisasi',
      path: '/management-master/parameterisasi',
      icon: 'tabler-adjustments-horizontal',
      urutan: 8,
      parentId: 'menu-management',
      status: true
    }
  })

  console.log('Menu upserted:', menu.id, '-', menu.nama)

  // Cari superadmin role
  const superadminRole = await prisma.role.findFirst({
    where: { id: 'superadmin-role-001' }
  })

  if (superadminRole) {
    const menuRole = await prisma.menuRole.upsert({
      where: { roleId_menuId: { roleId: superadminRole.id, menuId: menu.id } },
      update: {},
      create: {
        id: 'rm-parameterisasi-superadmin-001',
        roleId: superadminRole.id,
        menuId: menu.id
      }
    })

    console.log('MenuRole upserted:', menuRole.id)
  } else {
    console.log('Superadmin role not found, skipping menuRole')
  }
}

main().catch(console.error).finally(() => prisma.$disconnect())
