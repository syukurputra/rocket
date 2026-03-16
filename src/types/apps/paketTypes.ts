export type MasterPaketClient = {
  id: string
  nama: string
  deskripsi: string | null
  hargaBulanan: number | string
  hargaTahunan: number | string
  urutan: number
  status: boolean
  createdAt: Date | string
  updatedAt: Date | string
  paketMenus?: {
    deskripsi: string | null
    tampilkan: boolean
    menu: {
      id: string
      nama: string
      keterangan: string | null
    }
  }[]
}
