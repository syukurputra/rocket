const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  const all = await prisma.$queryRaw`
    SELECT id, "createdAt" FROM "tagihan"
    WHERE "nomorTagihan" IS NULL
    ORDER BY "createdAt" ASC
  `

  console.log('Tagihan tanpa nomor:', all.length)

  const monthMap = new Map()

  for (const t of all) {
    const d = new Date(t.createdAt)
    const key = d.getFullYear() + String(d.getMonth() + 1).padStart(2, '0')

    if (!monthMap.has(key)) monthMap.set(key, [])
    monthMap.get(key).push(t)
  }

  let updated = 0

  for (const [monthKey, items] of monthMap.entries()) {
    const prefix = 'TG-' + monthKey + '-'

    // Cari counter tertinggi yang sudah ada bulan ini
    const existing = await prisma.$queryRawUnsafe(
      `SELECT "nomorTagihan" FROM "tagihan" WHERE "nomorTagihan" LIKE $1 ORDER BY "nomorTagihan" DESC LIMIT 1`,
      prefix + '%'
    )

    let counter = existing.length > 0
      ? parseInt(existing[0].nomorTagihan.slice(-5)) + 1
      : 1

    for (const t of items) {
      const nomor = prefix + String(counter).padStart(5, '0')

      await prisma.$executeRawUnsafe(`UPDATE "tagihan" SET "nomorTagihan" = $1 WHERE id = $2`, nomor, t.id)
      counter++
      updated++
    }
  }

  console.log('Updated:', updated, 'tagihan')
}

main().catch(console.error).finally(() => prisma.$disconnect())
