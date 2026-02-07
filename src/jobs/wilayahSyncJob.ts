import { PrismaClient } from '@prisma/client'

import type { ScheduledJob } from '../types/scheduler'

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

// Check and seed wilayah data
async function syncWilayahData() {
  console.log('🔍 Checking wilayah data...')

  try {
    console.log('📥 No wilayah data found. Starting seeding process...')

    // Fetch provinces from API
    const provinces = await fetchWithRetry('https://emsifa.github.io/api-wilayah-indonesia/api/provinces.json')

    let processedProvinces = 0
    let processedCities = 0
    let processedDistricts = 0
    let processedVillages = 0

    // Process provinces sequentially to avoid overwhelming the API
    for (const province of provinces) {
      console.log(`📍 Processing: ${province.name}`)

      // Check if province already exists
      const existingProvince = await prisma.masterProvinsi.findUnique({
        where: { id: province.id }
      })

      if (existingProvince) {
        console.log(`⏭️  Skipping ${province.name} - already exists`)
        continue
      }

      // Create Province
      await prisma.masterProvinsi.create({
        data: { id: province.id, name: province.name }
      })
      processedProvinces++

      try {
        // Fetch Cities
        const cities = await fetchWithRetry(
          `https://emsifa.github.io/api-wilayah-indonesia/api/regencies/${province.id}.json`
        )

        for (const city of cities) {
          await prisma.masterKota.upsert({
            where: { id: city.id },
            update: { name: city.name, provinceId: province.id },
            create: { id: city.id, name: city.name, provinceId: province.id }
          })
          processedCities++

          // Fetch Districts
          const districts = await fetchWithRetry(
            `https://emsifa.github.io/api-wilayah-indonesia/api/districts/${city.id}.json`
          )

          for (const district of districts) {
            await prisma.masterKecamatan.upsert({
              where: { id: district.id },
              update: { name: district.name, cityId: city.id },
              create: { id: district.id, name: district.name, cityId: city.id }
            })
            processedDistricts++

            // Fetch Villages (batch insert for performance)
            const villages = await fetchWithRetry(
              `https://emsifa.github.io/api-wilayah-indonesia/api/villages/${district.id}.json`
            )

            if (villages.length > 0) {
              // Process in batches of 50
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
                processedVillages += batch.length
              }
            }
          }
        }

        console.log(
          `✓ ${province.name}: ${processedCities} cities, ${processedDistricts} districts, ${processedVillages} villages`
        )
      } catch (err) {
        console.error(`❌ Error processing ${province.name}:`, err)
      }
    }

    console.log(
      `✅ Seeding completed! Total: ${processedProvinces} provinces, ${processedCities} cities, ${processedDistricts} districts, ${processedVillages} villages`
    )
  } catch (error) {
    console.error('❌ Wilayah sync failed:', error)
    throw error
  }
}

export const wilayahSyncJob: ScheduledJob = {
  name: 'wilayah-sync',
  schedule: '46 22 * * *',
  task: syncWilayahData,
  enabled: false,

  // runOnStartup: true, // Jalankan saat startup di development
  // startupDelay: 5000, // Delay 5 detik
  description: 'Sinkronisasi data wilayah Indonesia (provinsi, kota, kecamatan, kelurahan)'
}
