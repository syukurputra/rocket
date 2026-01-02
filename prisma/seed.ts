import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting seed...')

  // Create SUPER ADMIN role (global, no company)
  let superAdminRole = await prisma.role.findFirst({
    where: {
      nama: 'SUPER ADMIN',
      companyId: null
    }
  })

  if (!superAdminRole) {
    superAdminRole = await prisma.role.create({
      data: {
        nama: 'SUPER ADMIN',
        deskripsi: 'Full system access with all permissions',
        status: true,
        companyId: null // Global role
      }
    })

    console.log('✅ SUPER ADMIN role created')
  } else {
    console.log('✅ SUPER ADMIN role already exists')
  }

  // Check if super admin user already exists
  const existingSuperAdmin = await prisma.user.findFirst({
    where: {
      email: 'syukur.putra@gmail.com'
    }
  })

  if (existingSuperAdmin) {
    // Update existing user to SUPER ADMIN role
    await prisma.user.update({
      where: { id: existingSuperAdmin.id },
      data: {
        roleId: superAdminRole.id,
        verifikasi: true
      }
    })

    console.log('✅ Super admin user updated with SUPER ADMIN role')
    console.log('📧 Email:', existingSuperAdmin.email)
    console.log('👤 Username:', existingSuperAdmin.username)
    console.log('🛡️  Role: SUPER ADMIN')
  } else {
    // Create super admin user
    const hashedPassword = await bcrypt.hash('12345678', 10)

    const superAdmin = await prisma.user.create({
      data: {
        username: 'syukur.putra',
        email: 'syukur.putra@gmail.com',
        password: hashedPassword,
        roleId: superAdminRole.id,
        verifikasi: true
      }
    })

    console.log('✅ Super admin created successfully!')
    console.log('📧 Email:', superAdmin.email)
    console.log('👤 Username:', superAdmin.username)
    console.log('🔑 Password: 12345678')
    console.log('🛡️  Role: SUPER ADMIN')
  }
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
