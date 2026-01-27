export type CompanyClient = {
  id: string
  nama: string
  alamat?: string
  telepon?: string
  email?: string
  status: boolean
  paketStartDate?: Date | string | null
  paketEndDate?: Date | string | null
  createdAt: Date
  updatedAt: Date
}

export type CompanyFormData = {
  nama: string
  alamat?: string
  telepon?: string
  email?: string
  status?: boolean
  paketStartDate?: string | null
  paketEndDate?: string | null
}
