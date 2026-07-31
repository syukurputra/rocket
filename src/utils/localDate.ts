// src/utils/localDate.ts
//
// `toISOString()` mengubah waktu ke UTC lebih dulu, sehingga tengah malam waktu
// lokal (WIB = UTC+7) jatuh ke tanggal sebelumnya. Untuk nilai <input type="date">
// yang memang tanpa zona waktu, tanggalnya harus dibaca apa adanya secara lokal.

/** `YYYY-MM-DD` menurut waktu lokal — aman dipakai sebagai value input date. */
export const toLocalDateValue = (d: Date): string => {
  const pad = (n: number) => String(n).padStart(2, '0')

  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** Tanggal 1 pada bulan berjalan. */
export const awalBulanIni = (): string => {
  const now = new Date()

  return toLocalDateValue(new Date(now.getFullYear(), now.getMonth(), 1))
}

/** Tanggal terakhir bulan berjalan (hari 0 bulan berikutnya). */
export const akhirBulanIni = (): string => {
  const now = new Date()

  return toLocalDateValue(new Date(now.getFullYear(), now.getMonth() + 1, 0))
}
