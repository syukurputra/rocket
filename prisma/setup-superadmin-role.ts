import * as fs from 'fs'
import * as path from 'path'

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Setting up Super Admin role and menu access...\n')

  try {
    // Read and execute SQL file
    const sqlPath = path.join(__dirname, 'setup-superadmin.sql')
    const sql = fs.readFileSync(sqlPath, 'utf-8')

    // Split by semicolon and execute each statement
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))

    for (const statement of statements) {
      if (statement.toLowerCase().includes('select')) {
        // For SELECT statements, show results
        const result = await prisma.$queryRawUnsafe(statement)

        console.log('✅ Verification result:', result)
      } else {
        // For other statements, just execute
        await prisma.$executeRawUnsafe(statement)
      }
    }

    console.log('\n🎉 Setup complete!')
    console.log('✅ Super Admin role created')
    console.log('✅ All menus created and assigned')
    console.log('✅ User syukur.putra@gmail.com updated to Super Admin role')
    console.log('✅ Full permissions granted (Create, Read, Update, Delete)')
  } catch (error) {
    console.error('❌ Error:', error)
    throw error
  }
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async e => {
    console.error('❌ Fatal error:', e)
    await prisma.$disconnect()
    process.exit(1)
  })
