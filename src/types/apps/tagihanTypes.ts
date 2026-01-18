export type TagihanClient = {
  id: string
  keterangan: string
  status: string
  mulaiSewa: Date | string
  selesaiSewa: Date | string
  nominal: number
  metodeBayar?: string | null
  buktiPembayaran?: string | null
  penghuni?: {
    id: string
    nama: string
  }
}
