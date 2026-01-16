import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  try {
    const companyId = 'cmk5gn6vl00015k68ujljo7x5'

    // Verify company exists
    const company = await prisma.company.findUnique({
      where: { id: companyId }
    })

    if (!company) {
      console.log('❌ Company tidak ditemukan!')
      return
    }

    // Create role
    const role = await prisma.role.create({
      data: {
        nama: 'SUPER ADMIN',
        deskripsi: 'Super Administrator with full access',
        companyId: companyId,
        status: true
      },
      include: {
        company: true
      }
    })

    console.log('✅ Role berhasil dibuat!')
    console.log('ID:', role.id)
    console.log('Nama:', role.nama)
    console.log('Deskripsi:', role.deskripsi)
    console.log('Company:', role.company.nama)
    console.log('Status:', role.status ? 'Active' : 'Inactive')
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
