// Script to add Company menu to Setting and assign to all roles
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function addCompanyMenu() {
  try {
    console.log('Adding Company menu to Setting...')

    // 1. Add Company menu under Setting parent
    const menu = await prisma.menu.upsert({
      where: { id: 'menu-setting-company' },
      update: {},
      create: {
        id: 'menu-setting-company',
        nama: 'Company',
        path: '/setting/company',
        icon: 'tabler-building',
        urutan: 3,
        parentId: 'menu-setting',
        status: true
      }
    })

    console.log('✓ Company menu created:', menu.nama)

    // 2. Get all roles
    const roles = await prisma.role.findMany()

    console.log(`Found ${roles.length} roles`)

    // 3. Assign menu to all roles
    let assignedCount = 0

    for (const role of roles) {
      const existing = await prisma.menuRole.findUnique({
        where: {
          roleId_menuId: {
            roleId: role.id,
            menuId: 'menu-setting-company'
          }
        }
      })

      if (!existing) {
        await prisma.menuRole.create({
          data: {
            id: `mr-${role.id}-setting-company`,
            roleId: role.id,
            menuId: 'menu-setting-company'
          }
        })
        assignedCount++
        console.log(`✓ Assigned to role: ${role.nama}`)
      } else {
        console.log(`- Already assigned to role: ${role.nama}`)
      }
    }

    console.log(`\n✓ Menu assigned to ${assignedCount} new roles`)

    // 4. Get all packages
    const packages = await prisma.masterPaket.findMany()

    console.log(`\nFound ${packages.length} packages`)

    // 5. Assign menu to all packages
    let packageAssignedCount = 0

    for (const pkg of packages) {
      const existing = await prisma.paketMenu.findUnique({
        where: {
          paketId_menuId: {
            paketId: pkg.id,
            menuId: 'menu-setting-company'
          }
        }
      })

      if (!existing) {
        await prisma.paketMenu.create({
          data: {
            id: `pm-${pkg.id}-setting-company`,
            paketId: pkg.id,
            menuId: 'menu-setting-company'
          }
        })
        packageAssignedCount++
        console.log(`✓ Assigned to package: ${pkg.nama}`)
      } else {
        console.log(`- Already assigned to package: ${pkg.nama}`)
      }
    }

    console.log(`\n✓ Menu assigned to ${packageAssignedCount} new packages`)
    console.log('\n✅ Company menu successfully added to Setting!')
  } catch (error) {
    console.error('Error adding Company menu:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

addCompanyMenu()
  .then(() => {
    console.log('\n✅ Script completed successfully')
    process.exit(0)
  })
  .catch(error => {
    console.error('\n❌ Script failed:', error)
    process.exit(1)
  })
