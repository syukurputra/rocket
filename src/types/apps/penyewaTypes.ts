export type PenyewaClient = {
  id: string
  nama: string
  email?: string | null
  nomorTelepon?: string | null
  nomorKtp?: string | null
  alamat?: string | null
  provinsi?: string | null
  kota?: string | null
  kecamatan?: string | null
  kelurahan?: string | null
  latitude?: number | null
  longitude?: number | null
  status: string
  createdBy?: {
    id: string
    username: string
  }
  updatedBy?: {
    id: string
    username: string
  }
}
