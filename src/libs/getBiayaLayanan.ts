// src/libs/getBiayaLayanan.ts
//
// Pembungkus sisi server: ambil nominal tiap jenjang dari m_parameter lalu
// hitung biaya layanan. Logika jenjangnya ada di ./biayaLayanan (dipakai bareng
// dengan komponen client).

import { getParameter } from './getParameter'
import { BIAYA_LAYANAN_PARAM_IDS, hitungBiayaLayanan, type TarifBiayaLayanan } from './biayaLayanan'

/** Peta id parameter → nominal biaya layanan. getParameter sudah di-cache. */
export async function getTarifBiayaLayanan(): Promise<TarifBiayaLayanan> {
  const entries = await Promise.all(BIAYA_LAYANAN_PARAM_IDS.map(async id => [id, await getParameter(id)] as const))

  return Object.fromEntries(entries)
}

/** Biaya layanan untuk sebuah harga, sesuai jenjang di Master Parameter. */
export async function getBiayaLayanan(harga: number): Promise<number> {
  return hitungBiayaLayanan(harga, await getTarifBiayaLayanan())
}
