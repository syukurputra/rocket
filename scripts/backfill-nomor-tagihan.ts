// Backfill nomorTagihan untuk tagihan lama yang masih NULL.
// Format: TG-YYYYMM-XXXXX (berdasarkan bulan createdAt, sekuensial per bulan).
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const nulls = await prisma.$queryRaw<{ id: string; createdAt: Date }[]>`
    SELECT id, "createdAt" FROM "tagihan" WHERE "nomorTagihan" IS NULL ORDER BY "createdAt" ASC
  `

  console.log(`Ditemukan ${nulls.length} tagihan tanpa nomorTagihan`)

  const counters = new Map<string, number>()

  for (const t of nulls) {
    const d = new Date(t.createdAt)
    const prefix = `TG-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}-`

    // Seed counter dari nomor terakhir yang sudah ada untuk bulan ini
    if (!counters.has(prefix)) {
      const rows = await prisma.$queryRawUnsafe<{ nomorTagihan: string }[]>(
        `SELECT "nomorTagihan" FROM "tagihan" WHERE "nomorTagihan" LIKE $1 ORDER BY "nomorTagihan" DESC LIMIT 1`,
        `${prefix}%`
      )

      counters.set(prefix, rows.length ? parseInt(rows[0].nomorTagihan.slice(-5)) : 0)
    }

    const next = counters.get(prefix)! + 1

    counters.set(prefix, next)

    const nomor = `${prefix}${String(next).padStart(5, '0')}`

    await prisma.$executeRawUnsafe(`UPDATE "tagihan" SET "nomorTagihan" = $1 WHERE id = $2`, nomor, t.id)
    console.log(`  ${t.id} -> ${nomor}`)
  }

  console.log('\n✅ Backfill selesai')
  await prisma.$disconnect()
}

main().catch(async e => {
  console.error('❌ Gagal:', e)
  await prisma.$disconnect()
  process.exit(1)
})
