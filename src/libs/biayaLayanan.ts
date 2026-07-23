// src/libs/biayaLayanan.ts
//
// Tarif biaya layanan berjenjang mengikuti besaran harga.
//
// Nominal tiap jenjang diambil dari tabel m_parameter (bisa diubah lewat menu
// Master Parameter), sedangkan batas jenjangnya didefinisikan di sini karena
// m_parameter hanya menyimpan id/nama/value — tidak ada kolom batas.
//
// Kalau jenjang di Master Parameter ditambah/diubah, sesuaikan daftar di bawah.
//
// File ini sengaja tidak mengimpor prisma supaya aman dipakai di komponen client.

export type TarifBiayaLayanan = Record<string, number | string | undefined>

type Tier = {
  id: string

  /** Label jenjang seperti yang tampil di Master Parameter */
  label: string

  /** Dievaluasi berurutan dari atas — yang pertama cocok yang dipakai */
  cocok: (harga: number) => boolean

  /** Dipakai kalau parameter belum ada di DB atau gagal diambil */
  nilaiDefault: number
}

export const BIAYA_LAYANAN_TIERS: Tier[] = [
  { id: 'ADMIN_BOOKING_1', label: '0 – 999.999', cocok: h => h < 1_000_000, nilaiDefault: 5_000 },
  { id: 'ADMIN_BOOKING_2', label: '1 jt – 9.999.999', cocok: h => h < 10_000_000, nilaiDefault: 10_000 },
  { id: 'ADMIN_BOOKING_3', label: '10 jt – 19.999.999', cocok: h => h < 20_000_000, nilaiDefault: 15_000 },
  { id: 'ADMIN_BOOKING_4', label: '20 jt – 29.999.999', cocok: h => h < 30_000_000, nilaiDefault: 20_000 },
  { id: 'ADMIN_BOOKING_5', label: '> 30 jt', cocok: h => h > 30_000_000, nilaiDefault: 25_000 }
]

export const BIAYA_LAYANAN_PARAM_IDS = BIAYA_LAYANAN_TIERS.map(t => t.id)

/**
 * Jenjang yang berlaku untuk sebuah harga.
 *
 * Harga yang tidak masuk jenjang mana pun jatuh ke jenjang tertinggi. Saat ini
 * itu hanya terjadi pada harga tepat 30.000.000 — jenjang 4 berhenti di
 * 29.999.999 dan jenjang 5 mulai di atas 30 jt.
 */
export function tierBiayaLayanan(harga: number): Tier {
  return BIAYA_LAYANAN_TIERS.find(t => t.cocok(harga)) ?? BIAYA_LAYANAN_TIERS[BIAYA_LAYANAN_TIERS.length - 1]
}

/**
 * Hitung biaya layanan untuk sebuah harga.
 *
 * @param harga  nominal harga (rupiah penuh)
 * @param tarif  peta id parameter → nominal, hasil dari m_parameter
 */
export function hitungBiayaLayanan(harga: number, tarif: TarifBiayaLayanan = {}): number {
  if (!Number.isFinite(harga) || harga <= 0) return 0

  const tier = tierBiayaLayanan(harga)
  const nilai = Number(tarif[tier.id])

  return Number.isFinite(nilai) && nilai >= 0 ? nilai : tier.nilaiDefault
}
