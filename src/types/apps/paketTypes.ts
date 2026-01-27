export type MasterPaketClient = {
  id: string
  nama: string
  deskripsi: string | null
  harga: number | string
  durasi: number
  status: boolean
  createdAt: Date | string
  updatedAt: Date | string
  paketMenus?: {
    menu: {
      id: string
      nama: string
      keterangan: string | null
    }
  }[]
}
