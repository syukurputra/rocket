/**
 * Script to insert menu 'menu-paket-pilihan' to all existing roles
 * This uses Prisma Client to ensure proper data handling
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function insertPaketMenuToAllRoles() {
  try {
    console.log('🔍 Fetching all roles...')

    // Get all roles
    const roles = await prisma.role.findMany({
      select: {
        id: true,
        nama: true
      }
    })

    console.log(`✅ Found ${roles.length} roles`)

    // Check if menu exists
    const menu = await prisma.menu.findUnique({
      where: { id: 'menu-paket-pilihan' }
    })

    if (!menu) {
      console.error('❌ Menu with id "menu-paket-pilihan" not found!')
      console.log('Please create the menu first before running this script.')
      return
    }

    console.log(`✅ Menu found: ${menu.nama}`)

    let insertedCount = 0
    let skippedCount = 0

    // Insert menu_role for each role
    for (const role of roles) {
      // Check if already exists
      const existing = await prisma.menuRole.findUnique({
        where: {
          roleId_menuId: {
            roleId: role.id,
            menuId: 'menu-paket-pilihan'
          }
        }
      })

      if (existing) {
        console.log(`⏭️  Skipped: ${role.nama} (already has this menu)`)
        skippedCount++
        continue
      }

      // Insert new menu_role
      await prisma.menuRole.create({
        data: {
          roleId: role.id,
          menuId: 'menu-paket-pilihan'
        }
      })

      console.log(`✅ Inserted: ${role.nama}`)
      insertedCount++
    }

    console.log('\n📊 Summary:')
    console.log(`   Total roles: ${roles.length}`)
    console.log(`   Inserted: ${insertedCount}`)
    console.log(`   Skipped: ${skippedCount}`)

    // Verify the results
    console.log('\n🔍 Verifying results...')
    const menuRoles = await prisma.menuRole.findMany({
      where: {
        menuId: 'menu-paket-pilihan'
      },
      include: {
        role: {
          select: {
            nama: true
          }
        }
      }
    })

    console.log(`\n✅ Menu "menu-paket-pilihan" is now assigned to ${menuRoles.length} roles:`)
    menuRoles.forEach(mr => {
      console.log(`   - ${mr.role.nama}`)
    })
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the script
insertPaketMenuToAllRoles()
