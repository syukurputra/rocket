export type BannerPromoClient = {
  id: string
  judul: string
  deskripsi?: string | null
  imageUrl?: string | null
  tampilkanPeriode?: boolean
  periodeAwal?: string | null
  periodeAkhir?: string | null
  status: boolean
  createdAt: string
  updatedAt: string
}
