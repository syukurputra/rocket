export type PenyewaClient = {
  id: string
  nama: string
  email?: string | null
  nomorTelepon?: string | null
  alamat?: string | null
  provinsi?: string | null
  kota?: string | null
  kecamatan?: string | null
  kelurahan?: string | null
  latitude?: number | null
  longitude?: number | null
  status: string
  periodeSewa?: string
  mulaiSewa: string | Date
  selesaiSewa: string | Date
  asetId: string
  ruanganId: string
  aset?: {
    id: string
    nama: string
    jenis: string
  }
  ruangan?: {
    id: string
    nama: string
    status: string
  }
  createdBy?: {
    id: string
    username: string
  }
  updatedBy?: {
    id: string
    username: string
  }
}
