import fs from 'fs'
import path from 'path'

import { PrismaClient } from '@prisma/client'

// Manually load .env
const envPath = path.resolve(process.cwd(), '.env')

if (fs.existsSync(envPath)) {
  console.log('Loading .env from', envPath)
  const envConfig = fs.readFileSync(envPath, 'utf8')

  envConfig.split('\n').forEach(line => {
    const parts = line.split('=')
    const key = parts[0]?.trim()
    const value = parts.slice(1).join('=').trim()

    if (key && value && !key.startsWith('#')) {
      // Remove quotes if present
      process.env[key] = value.replace(/^"|"$/g, '')
    }
  })
} else {
  console.log('.env not found at', envPath)
}

const prisma = new PrismaClient()

async function main() {
  console.log('Testing connection to DATABASE_URL:', process.env.DATABASE_URL?.split('@')[1] || 'Undefined')
  console.log('Testing connection to DIRECT_URL:', process.env.DIRECT_URL?.split('@')[1] || 'Undefined')

  try {
    await prisma.$connect()
    console.log('✅ Connection successful!')
    const result = await prisma.$queryRaw`SELECT 1 as result`

    console.log('Query result:', result)
  } catch (e: any) {
    console.error('❌ Connection failed:', e.message)
    if (e.meta) console.error('Meta:', e.meta)
  } finally {
    await prisma.$disconnect()
  }
}

main()
