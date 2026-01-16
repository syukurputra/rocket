import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  try {
    const roleId = 'cmk5gpcoo00015k1o6bqq8w9q'
    const menuId = 'cmk5hbmy000015kywhufp8w6d'

    // Verify role exists
    const role = await prisma.role.findUnique({
      where: { id: roleId }
    })

    if (!role) {
      console.log('❌ Role tidak ditemukan!')

      return
    }

    // Verify menu exists
    const menu = await prisma.menu.findUnique({
      where: { id: menuId },
      include: {
        parent: true
      }
    })

    if (!menu) {
      console.log('❌ Menu tidak ditemukan!')

      return
    }

    // Insert menu role
    const menuRole = await prisma.menuRole.create({
      data: {
        roleId: roleId,
        menuId: menuId
      },
      include: {
        role: true,
        menu: {
          include: {
            parent: true
          }
        }
      }
    })

    console.log('✅ Menu berhasil di-assign ke role!')
    console.log('ID:', menuRole.id)
    console.log('Role:', menuRole.role.nama)
    console.log('Menu:', menuRole.menu.nama)

    if (menuRole.menu.parent) {
      console.log('Parent Menu:', menuRole.menu.parent.nama)
    }
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
