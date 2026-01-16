export type KeuanganClient = {
  id: string
  jenis: string
  keterangan: string
  tanggal: string | Date
  asetId: string
  nominal: number
  categoryKeuanganId: string
  aset?: {
    id: string
    nama: string
    jenis: string
  }
  categoryKeuangan?: {
    id: string
    nama: string
    deskripsi: string | null
    color: string | null
    icon?: {
      id: string
      nama: string
      code: string
    } | null
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
