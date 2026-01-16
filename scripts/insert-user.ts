import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  try {
    const email = 'syukur.putra@gmail.com'
    const password = '12345678'
    const companyId = 'cmk5gn6vl00015k68ujljo7x5'
    const roleId = 'cmk5gpcoo00015k1o6bqq8w9q'

    // Verify company exists
    const company = await prisma.company.findUnique({
      where: { id: companyId }
    })

    if (!company) {
      console.log('❌ Company tidak ditemukan!')
      return
    }

    // Verify role exists
    const role = await prisma.role.findUnique({
      where: { id: roleId }
    })

    if (!role) {
      console.log('❌ Role tidak ditemukan!')
      return
    }

    // Generate username from email
    const username = email.split('@')[0]

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user
    const user = await prisma.user.create({
      data: {
        username: username,
        email: email,
        password: hashedPassword,
        companyId: companyId,
        roleId: roleId,
        status: true,
        verifikasi: true // Set to true for testing
      },
      include: {
        company: true,
        role: true
      }
    })

    console.log('✅ User berhasil dibuat!')
    console.log('ID:', user.id)
    console.log('Username:', user.username)
    console.log('Email:', user.email)
    console.log('Company:', user.company?.nama)
    console.log('Role:', user.role?.nama)
    console.log('Status:', user.status ? 'Active' : 'Inactive')
    console.log('Verifikasi:', user.verifikasi ? 'Verified' : 'Not Verified')
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
