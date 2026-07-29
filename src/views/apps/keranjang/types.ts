// Tipe & format bersama untuk halaman keranjang dan konfirmasi bayar.

export interface KeranjangItem {
  id: string
  asetId: string
  asetNama: string
  asetAlamat: string
  itemAsetId: string
  itemAsetNama: string
  jenisHarga: string
  mulaiSewa: string
  selesaiSewa: string
  durasi: number
  hargaSatuan: number
  total: number
  catatan: string | null
}

export interface KeranjangSummary {
  jumlahItem: number
  subtotal: number
  totalBayar: number
}

export interface KeranjangResponse {
  data: KeranjangItem[]
  summary: KeranjangSummary
}

export const JENIS_LABEL: Record<string, string> = {
  JAM: 'Jam',
  HARIAN: 'Hari',
  BULANAN: 'Bulan',
  TAHUNAN: 'Tahun'
}

export const formatCurrency = (val: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val)

/** Sewa per jam ditampilkan lengkap dengan jamnya, jenis lain cukup tanggal. */
export const formatTanggal = (iso: string, jenisHarga: string) =>
  new Date(iso).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    ...(jenisHarga === 'JAM' ? { hour: '2-digit', minute: '2-digit' } : {})
  })
