// src/libs/hargaPromo.ts
//
// Harga promo berlaku menyeluruh: yang tampil di halaman publish, yang dihitung
// saat booking, dan yang ditagihkan saat pembayaran memakai nilai yang sama.
//
// File ini tidak mengimpor prisma supaya aman dipakai di komponen client.

export type HargaItemAsetLike = {
  harga: unknown
  promoAktif?: boolean | null
  hargaPromo?: unknown
}

/** Promo dianggap berlaku hanya kalau flag-nya aktif dan nominalnya diisi. */
export function isPromoBerlaku(h: HargaItemAsetLike | null | undefined): boolean {
  return !!h?.promoAktif && Number(h.hargaPromo) > 0
}

/** Harga yang benar-benar dipakai — harga promo kalau berlaku, selain itu harga normal. */
export function hargaEfektif(h: HargaItemAsetLike | null | undefined): number {
  if (!h) return 0

  return isPromoBerlaku(h) ? Number(h.hargaPromo) : Number(h.harga)
}
