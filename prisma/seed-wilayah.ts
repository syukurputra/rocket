import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Retry helper with exponential backoff
async function fetchWithRetry(url: string, retries = 3, delay = 1000): Promise<any> {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url)

      if (!response.ok) throw new Error(`HTTP ${response.status}`)

      return await response.json()
    } catch (error) {
      if (i === retries - 1) throw error
      console.log(`Retry ${i + 1}/${retries} for ${url}`)
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)))
    }
  }
}

// Simple concurrency limiter
async function asyncPool(poolLimit: number, array: any[], iteratorFn: (item: any) => Promise<any>) {
  const ret: Promise<any>[] = []
  const executing: Promise<any>[] = []

  for (const item of array) {
    const p = Promise.resolve().then(() => iteratorFn(item))

    ret.push(p)

    if (poolLimit <= array.length) {
      const e: Promise<any> = p.then(() => executing.splice(executing.indexOf(e), 1))

      executing.push(e)

      if (executing.length >= poolLimit) {
        await Promise.race(executing)
      }
    }
  }

  return Promise.all(ret)
}

async function main() {
  console.log('Start seeding wilayah (Optimized with Retry)...')

  // 1. Fetch Provinces
  console.log('Fetching provinces...')
  const provinces = await fetchWithRetry('https://emsifa.github.io/api-wilayah-indonesia/api/provinces.json')

  // Process Provinces with Concurrency Limit (2 provinces at a time to avoid overwhelming API)
  await asyncPool(2, provinces, async (province: any) => {
    console.log(`Processing Province: ${province.name}`)

    // Upsert Province
    await prisma.masterProvinsi.upsert({
      where: { id: province.id },
      update: { name: province.name },
      create: { id: province.id, name: province.name }
    })

    // 2. Fetch Cities
    try {
      const cities = await fetchWithRetry(
        `https://emsifa.github.io/api-wilayah-indonesia/api/regencies/${province.id}.json`
      )

      // Process Cities sequentially to avoid too many parallel requests
      for (const city of cities) {
        await prisma.masterKota.upsert({
          where: { id: city.id },
          update: { name: city.name, provinceId: province.id },
          create: { id: city.id, name: city.name, provinceId: province.id }
        })

        // 3. Fetch Districts
        const districts = await fetchWithRetry(
          `https://emsifa.github.io/api-wilayah-indonesia/api/districts/${city.id}.json`
        )

        // Process Districts sequentially
        for (const district of districts) {
          await prisma.masterKecamatan.upsert({
            where: { id: district.id },
            update: { name: district.name, cityId: city.id },
            create: { id: district.id, name: district.name, cityId: city.id }
          })

          // 4. Fetch Villages
          const villages = await fetchWithRetry(
            `https://emsifa.github.io/api-wilayah-indonesia/api/villages/${district.id}.json`
          )

          if (villages.length > 0) {
            // Process villages in batches to avoid overwhelming the database
            const batchSize = 50

            for (let i = 0; i < villages.length; i += batchSize) {
              const batch = villages.slice(i, i + batchSize)

              await Promise.all(
                batch.map((v: any) =>
                  prisma.masterKelurahan.upsert({
                    where: { id: v.id },
                    update: { name: v.name, districtId: district.id },
                    create: { id: v.id, name: v.name, districtId: district.id }
                  })
                )
              )
            }
          }
        }
      }
    } catch (err) {
      console.error(`Error processing province ${province.name}:`, err)
    }
  })

  console.log('Seeding finished.')
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
