export type PenghuniClient = {
  id: string
  nama: string
  email?: string | null
  nomorTelepon?: string | null
  status: string
  mulaiHuni: string | Date
  selesaiHuni: string | Date
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
