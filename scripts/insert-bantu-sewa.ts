import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  try {
    const paketId = 'cmk5gl33y00005kq0kby8dy7f'

    // Verify paket exists
    const paket = await prisma.masterPaket.findUnique({
      where: { id: paketId }
    })

    if (!paket) {
      console.log('❌ Paket tidak ditemukan!')

      return
    }

    // Create company with paket
    const company = await prisma.company.create({
      data: {
        nama: 'Bantu Sewa',
        paketId: paketId,
        status: true
      },
      include: {
        paket: true
      }
    })

    console.log('✅ Company berhasil dibuat!')
    console.log('ID:', company.id)
    console.log('Nama:', company.nama)
    console.log('Paket:', company.paket?.nama)
    console.log('Harga Paket:', company.paket?.harga.toString())
    console.log('Status:', company.status ? 'Active' : 'Inactive')
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
