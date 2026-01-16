import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  try {
    console.log('🔍 Checking paket menu assignments...\n')

    // Get all pakets with their menu assignments
    const pakets = await prisma.masterPaket.findMany({
      include: {
        paketMenus: {
          include: {
            menu: true
          }
        }
      },
      orderBy: { nama: 'asc' }
    })

    console.log(`📦 Found ${pakets.length} paket(s):\n`)

    pakets.forEach(paket => {
      console.log(`\n  ├─ ${paket.nama} (ID: ${paket.id})`)
      console.log(`     Harga: Rp ${Number(paket.harga).toLocaleString('id-ID')}`)
      console.log(`     Status: ${paket.status ? 'Aktif' : 'Nonaktif'}`)

      if (paket.paketMenus.length > 0) {
        console.log(`     Assigned Menus (${paket.paketMenus.length}):`)
        paket.paketMenus.forEach(pm => {
          console.log(`       └─ ${pm.menu.nama} (${pm.menu.path || 'no path'})`)
        })
      } else {
        console.log(`     ⚠️  No menus assigned`)
      }
    })

    console.log('\n\n✅ Check complete!')
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
