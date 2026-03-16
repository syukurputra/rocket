import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  try {
    // Insert PAKET A
    const paket = await prisma.masterPaket.create({
      data: {
        nama: 'PAKET A',
        hargaBulanan: 0,
        hargaTahunan: 0,
        status: true
      }
    })

    console.log('✅ Paket berhasil dibuat!')
    console.log('ID:', paket.id)
    console.log('Nama:', paket.nama)
    console.log('Status:', paket.status ? 'Active' : 'Inactive')
    console.log('')
    console.log('Copy ID ini untuk digunakan di company:')
    console.log(paket.id)
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
