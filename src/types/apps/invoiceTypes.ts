export type InvoiceStatus = 'PENDING' | 'KONFIRMASI' | 'PAID' | 'CANCELLED' | 'EXPIRED'

export type InvoiceClient = {
  id: string
  nomorInvoice: string
  status: InvoiceStatus
  billingCycle: 'monthly' | 'annually'
  subtotal: number | string
  pajak: number | string
  total: number | string
  catatan?: string | null
  tanggalInvoice: Date | string
  tanggalJatuhTempo: Date | string
  tanggalBayar?: Date | string | null
  buktiPembayaran?: string | null
  createdAt: Date | string
  updatedAt: Date | string
  companyId: string
  paketId: string
  createdById: string
  paket?: {
    id: string
    nama: string
    hargaBulanan: number | string
    hargaTahunan: number | string
  }
  company?: {
    id: string
    nama: string
  }
  createdBy?: {
    id: string
    username: string
    email: string
  }
}

export type InvoiceFormData = {
  paketId: string
  billingCycle: 'monthly' | 'annually'
  catatan?: string
}
