// src/libs/alamatPemesan.ts
//
// Alamat pemesan dipakai saat aset mengaktifkan "Alamat Pemesan" — pembayaran
// booking baru boleh diproses kalau alamat profil pemesan sudah lengkap.

export type AlamatPemesan = {
  alamat: string | null
  provinsi: string | null
  kota: string | null
  kecamatan: string | null
  kelurahan: string | null
}

/** Alamat dianggap lengkap kalau alamat jalan dan seluruh wilayahnya terisi. */
export function isAlamatLengkap(user: Partial<AlamatPemesan> | null | undefined): boolean {
  if (!user) return false

  return [user.alamat, user.provinsi, user.kota, user.kecamatan, user.kelurahan].every(
    v => typeof v === 'string' && v.trim() !== ''
  )
}

/** Alamat satu baris untuk ditampilkan di halaman konfirmasi bayar. */
export function formatAlamatLengkap(user: Partial<AlamatPemesan> | null | undefined): string {
  if (!user) return ''

  return [user.alamat, user.kelurahan, user.kecamatan, user.kota, user.provinsi]
    .filter(v => typeof v === 'string' && v.trim() !== '')
    .join(', ')
}
