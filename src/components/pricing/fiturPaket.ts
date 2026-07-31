// src/components/pricing/fiturPaket.ts
//
// Daftar fitur di kartu harga harus sama persis di semua paket supaya barisnya
// sejajar — fitur yang tidak termasuk sebuah paket tetap ditampilkan, hanya
// ditandai tidak tersedia.

import type { MasterPaketClient } from '@/src/types/apps/paketTypes'

export type FiturPaket = {
  id: string
  label: string
}

/**
 * Gabungan fitur dari seluruh paket, tanpa duplikat.
 *
 * `paketMenus` tidak punya kolom urutan, jadi urutannya mengikuti kemunculan
 * pertama pada daftar paket (yang sudah terurut `urutan` dari API). Hasilnya
 * konsisten untuk semua kartu karena dihitung sekali di induknya.
 */
export function gabungFiturPaket(pakets: MasterPaketClient[]): FiturPaket[] {
  const hasil: FiturPaket[] = []
  const sudahAda = new Set<string>()

  for (const paket of pakets) {
    for (const pm of paket.paketMenus ?? []) {
      if (!pm.tampilkan || sudahAda.has(pm.menu.id)) continue

      sudahAda.add(pm.menu.id)
      hasil.push({ id: pm.menu.id, label: pm.deskripsi || pm.menu.keterangan || pm.menu.nama })
    }
  }

  return hasil
}

/** Id menu yang benar-benar dimiliki sebuah paket. */
export function fiturDimiliki(paket: MasterPaketClient): Set<string> {
  return new Set((paket.paketMenus ?? []).filter(pm => pm.tampilkan).map(pm => pm.menu.id))
}
