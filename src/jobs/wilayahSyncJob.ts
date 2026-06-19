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

export interface SyncWilayahResult {
  addedProvinces: number
  addedCities: number
  addedDistricts: number
  addedVillages: number
  skipped: boolean
  message: string
}

// Sync satu provinsi beserta semua kota/kecamatan/kelurahan-nya
async function syncSingleProvince(
  province: { id: string; name: string },
  existingProvinceIds: Set<string>
): Promise<{ addedCities: number; addedDistricts: number; addedVillages: number; addedProvince: boolean }> {
  let addedProvince = false
  let addedCities = 0
  let addedDistricts = 0
  let addedVillages = 0

  if (!existingProvinceIds.has(province.id)) {
    await prisma.masterProvinsi.create({
      data: { id: province.id, name: province.name }
    })
    addedProvince = true
    console.log(`📍 Provinsi baru: ${province.name}`)
  }

  const cities = await fetchWithRetry(
    `https://emsifa.github.io/api-wilayah-indonesia/api/regencies/${province.id}.json`
  )

  const existingCityIds = new Set(
    (await prisma.masterKota.findMany({
      where: { provinceId: province.id },
      select: { id: true }
    })).map(c => c.id)
  )

  const newCities = cities.filter((c: any) => !existingCityIds.has(c.id))

  if (newCities.length > 0) {
    await prisma.masterKota.createMany({
      data: newCities.map((c: any) => ({ id: c.id, name: c.name, provinceId: province.id })),
      skipDuplicates: true
    })
    addedCities = newCities.length
  }

  for (const city of cities) {
    const districts = await fetchWithRetry(
      `https://emsifa.github.io/api-wilayah-indonesia/api/districts/${city.id}.json`
    )

    const existingDistrictIds = new Set(
      (await prisma.masterKecamatan.findMany({
        where: { cityId: city.id },
        select: { id: true }
      })).map(d => d.id)
    )

    const newDistricts = districts.filter((d: any) => !existingDistrictIds.has(d.id))

    if (newDistricts.length > 0) {
      await prisma.masterKecamatan.createMany({
        data: newDistricts.map((d: any) => ({ id: d.id, name: d.name, cityId: city.id })),
        skipDuplicates: true
      })
      addedDistricts += newDistricts.length
    }

    for (const district of districts) {
      const villages = await fetchWithRetry(
        `https://emsifa.github.io/api-wilayah-indonesia/api/villages/${district.id}.json`
      )

      if (villages.length === 0) continue

      const existingVillageIds = new Set(
        (await prisma.masterKelurahan.findMany({
          where: { districtId: district.id },
          select: { id: true }
        })).map(v => v.id)
      )

      const newVillages = villages.filter((v: any) => !existingVillageIds.has(v.id))

      if (newVillages.length > 0) {
        const batchSize = 100

        for (let i = 0; i < newVillages.length; i += batchSize) {
          const batch = newVillages.slice(i, i + batchSize)

          await prisma.masterKelurahan.createMany({
            data: batch.map((v: any) => ({ id: v.id, name: v.name, districtId: district.id })),
            skipDuplicates: true
          })
          addedVillages += batch.length
        }
      }
    }
  }

  if (addedCities > 0) {
    console.log(`✓ ${province.name}: +${addedCities} kota, +${addedDistricts} kecamatan, +${addedVillages} kelurahan`)
  }

  return { addedProvince, addedCities, addedDistricts, addedVillages }
}

/**
 * Sync wilayah untuk satu provinsi tertentu berdasarkan ID.
 * Dipakai oleh API manual trigger.
 */
export async function syncWilayahByProvinceId(provinceId: string): Promise<SyncWilayahResult> {
  console.log(`🔍 Sync wilayah untuk provinsi ID: ${provinceId}`)

  const allProvinces = await fetchWithRetry('https://emsifa.github.io/api-wilayah-indonesia/api/provinces.json')
  const province = allProvinces.find((p: any) => p.id === provinceId)

  if (!province) {
    throw new Error(`Provinsi dengan ID "${provinceId}" tidak ditemukan di API wilayah.`)
  }

  const existingProvinceIds = new Set(
    (await prisma.masterProvinsi.findMany({ select: { id: true } })).map(p => p.id)
  )

  const result = await syncSingleProvince(province, existingProvinceIds)

  const total = (result.addedProvince ? 1 : 0) + result.addedCities + result.addedDistricts + result.addedVillages
  const message =
    total === 0
      ? `Data ${province.name} sudah lengkap, tidak ada yang ditambahkan.`
      : `Sync ${province.name} selesai. Ditambahkan: ${result.addedProvince ? 1 : 0} provinsi, ${result.addedCities} kota, ${result.addedDistricts} kecamatan, ${result.addedVillages} kelurahan.`

  return {
    addedProvinces: result.addedProvince ? 1 : 0,
    addedCities: result.addedCities,
    addedDistricts: result.addedDistricts,
    addedVillages: result.addedVillages,
    skipped: total === 0,
    message
  }
}

// Check and seed wilayah data (full sync untuk scheduler)
async function syncWilayahData() {
  console.log('🔍 Checking wilayah data...')

  try {
    // Top-level check: jika provinsi dan kelurahan sudah ada dalam jumlah wajar, skip seluruh sync
    // Indonesia: 38 provinsi, 83.000+ kelurahan
    const [provinceCount, villageCount] = await Promise.all([
      prisma.masterProvinsi.count(),
      prisma.masterKelurahan.count()
    ])

    if (provinceCount >= 34 && villageCount > 10000) {
      console.log(
        `✅ Data wilayah sudah lengkap (${provinceCount} provinsi, ${villageCount} kelurahan). Sync dilewati.`
      )

      return
    }

    console.log(
      `📥 Data belum lengkap (${provinceCount} provinsi, ${villageCount} kelurahan). Memulai sync...`
    )

    const provinces = await fetchWithRetry('https://emsifa.github.io/api-wilayah-indonesia/api/provinces.json')

    const existingProvinceIds = new Set(
      (await prisma.masterProvinsi.findMany({ select: { id: true } })).map(p => p.id)
    )

    let addedProvinces = 0
    let addedCities = 0
    let addedDistricts = 0
    let addedVillages = 0

    for (const province of provinces) {
      try {
        const result = await syncSingleProvince(province, existingProvinceIds)

        if (result.addedProvince) addedProvinces++
        addedCities += result.addedCities
        addedDistricts += result.addedDistricts
        addedVillages += result.addedVillages
      } catch (err) {
        console.error(`❌ Error processing ${province.name}:`, err)
      }
    }

    if (addedProvinces + addedCities + addedDistricts + addedVillages === 0) {
      console.log('✅ Tidak ada data baru yang perlu ditambahkan.')
    } else {
      console.log(
        `✅ Sync selesai! Ditambahkan: ${addedProvinces} provinsi, ${addedCities} kota, ${addedDistricts} kecamatan, ${addedVillages} kelurahan`
      )
    }
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
