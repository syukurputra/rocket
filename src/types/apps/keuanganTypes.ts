export type KeuanganClient = {
  id: string
  jenis: string
  keterangan: string
  asetId: string
  nominal: number
  iconId: string
  aset?: {
    id: string
    nama: string
    jenis: string
  }
  icon?: {
    id: string
    nama: string
    code: string
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
