export type TagihanClient = {
  id: string
  judul?: string
  keterangan: string
  status: string
  mulaiSewa: Date | string
  selesaiSewa: Date | string
  nominal: number
  metodeBayar?: string | null
  buktiPembayaran?: string | null
  midtransOrderId?: string | null
  midtransTransactionId?: string | null
  midtransTransactionStatus?: string | null
  midtransPaymentType?: string | null
  midtransTransactionTime?: Date | string | null
  paymentUrl?: string | null
  penyewa?: {
    id: string
    nama: string
  }
}
