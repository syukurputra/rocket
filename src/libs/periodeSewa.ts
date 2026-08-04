// src/libs/periodeSewa.ts
//
// Perhitungan tanggal selesai sewa. Sebelumnya rumus ini disalin di tiga form
// booking sehingga rawan berbeda-beda.
//
// Untuk sewa berbasis TANGGAL (harian/bulanan/tahunan), tanggal selesai bersifat
// INKLUSIF — hari terakhir masih terhitung dipakai:
//
//   1 hari  mulai 03 Agu 2026  → selesai 03 Agu 2026
//   3 hari  mulai 03 Agu 2026  → selesai 05 Agu 2026
//   1 bulan mulai 03 Agu 2026  → selesai 02 Sep 2026
//   1 tahun mulai 03 Agu 2026  → selesai 02 Agu 2027
//
// Untuk sewa per JAM, selesai adalah titik waktu: 10:00 + 1 jam = 11:00.
//
// Aturan inklusif ini juga membuat booking berurutan tidak saling bentrok —
// 03–03 dan 04–04 tidak beririsan, sedangkan pada rumus lama (03–04 dan 04–05)
// tanggal 04 dianggap tabrakan.

/**
 * Batas telat H+1 — satu hari setelah tanggal selesai sewa.
 *
 * Hanya diisi kalau item asetnya mengaktifkan `telatBookingAktif`. Status telat
 * sengaja tidak disimpan, melainkan dihitung dari nilai ini (lihat `isTelat`)
 * supaya tidak perlu job harian dan tidak pernah basi.
 */
export function hitungLateDate(selesaiSewa: Date): Date {
  const late = new Date(selesaiSewa)

  late.setDate(late.getDate() + 1)

  return late
}

/** Booking dianggap telat kalau sekarang sudah melewati batas telatnya. */
export function isTelat(lateDate?: Date | string | null, sekarang: Date = new Date()): boolean {
  if (!lateDate) return false

  return sekarang.getTime() > new Date(lateDate).getTime()
}

/** Tanggal selesai sewa dari tanggal mulai, durasi, dan jenis harganya. */
export function hitungSelesaiSewa(mulai: Date, durasi: number, jenisHarga: string): Date {
  const selesai = new Date(mulai)
  const jumlah = Math.max(1, Math.floor(durasi))

  switch (jenisHarga) {
    case 'JAM':
      selesai.setHours(selesai.getHours() + jumlah)
      break
    case 'HARIAN':
      selesai.setDate(selesai.getDate() + jumlah - 1)
      break
    case 'BULANAN':
      selesai.setMonth(selesai.getMonth() + jumlah)
      selesai.setDate(selesai.getDate() - 1)
      break
    case 'TAHUNAN':
      selesai.setFullYear(selesai.getFullYear() + jumlah)
      selesai.setDate(selesai.getDate() - 1)
      break
    default:
      break
  }

  return selesai
}
