export type CategoryKeuanganClient = {
  id: string
  nama: string
  jenis: string // "Pengeluaran" or "Pemasukan"
  deskripsi: string | null
  color: string | null
  status: boolean
  createdAt: Date | string
  updatedAt: Date | string
  companyId: string
  iconId: string | null
  icon?: {
    id: string
    nama: string
    code: string
  } | null
}
