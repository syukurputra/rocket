export type TagihanClient = {
  id: string
  judul?: string
  keterangan: string
  status: string
  periodeSewa?: string | null
  mulaiSewa: Date | string
  selesaiSewa: Date | string
  nominal: number
  metodeBayar?: string | null
  buktiPembayaran?: string | null
  penyewaId?: string | null
  asetId?: string | null
  ruanganId?: string | null

  penyewa?: {
    id: string
    nama: string
    nomorTelepon?: string | null
    email?: string | null
  }
  aset?: { id: string; nama: string } | null
  ruangan?: { id: string; nama: string } | null
}
